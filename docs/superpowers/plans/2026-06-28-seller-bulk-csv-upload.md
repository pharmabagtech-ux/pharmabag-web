# Seller Bulk CSV Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CSV bulk upload flow to the seller portal — seller downloads a master catalog template, fills in Stock and Price, uploads it back; only rows whose product name exactly matches a MasterProduct are created.

**Architecture:** Two new backend files (service + controller) wired into the existing `ProductsModule`; the service calls `ProductsService.create()` with master-sourced fields + seller-supplied stock/price. Four frontend changes: two API functions, a hook file, a new page, and a button on the existing products page.

**Tech Stack:** NestJS + Prisma (API), `csv-parser` (already installed), Next.js 14 App Router + TanStack Query (seller frontend)

---

## File Map

| Action | Path |
|--------|------|
| Create | `pharmabag-api-fix/src/modules/products/services/seller-bulk-csv.service.ts` |
| Create | `pharmabag-api-fix/src/modules/products/seller-bulk-csv.controller.ts` |
| Modify | `pharmabag-api-fix/src/modules/products/products.module.ts` |
| Modify | `pharmabag-web/apps/seller/api/seller.api.ts` |
| Create | `pharmabag-web/apps/seller/hooks/useSellerBulkUpload.ts` |
| Create | `pharmabag-web/apps/seller/app/products/bulk-upload/page.tsx` |
| Modify | `pharmabag-web/apps/seller/app/products/page.tsx` |

---

## Task 1: SellerBulkCsvService — business logic

**File:** `pharmabag-api-fix/src/modules/products/services/seller-bulk-csv.service.ts`

The service owns both the template generation and upload processing. It depends on `PrismaService` (injected) and `ProductsService` (injected). The upload flow: get seller profile once → parse CSV → for each row: validate fields → exact-name lookup in MasterProduct → check for duplicate listing → call `ProductsService.create()`.

- [ ] **Step 1: Write the unit test file**

Create `pharmabag-api-fix/src/modules/products/services/seller-bulk-csv.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SellerBulkCsvService } from './seller-bulk-csv.service';
import { PrismaService } from '../../../database/prisma.service';
import { ProductsService } from '../products.service';

const mockPrisma = {
  masterProduct: { findMany: jest.fn(), findFirst: jest.fn() },
  sellerProfile: { findUnique: jest.fn() },
  product: { findFirst: jest.fn() },
};

const mockProductsService = { create: jest.fn() };

describe('SellerBulkCsvService', () => {
  let service: SellerBulkCsvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerBulkCsvService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();
    service = module.get<SellerBulkCsvService>(SellerBulkCsvService);
    jest.clearAllMocks();
  });

  describe('generateTemplate', () => {
    it('returns CSV with header and one row per active master product', async () => {
      mockPrisma.masterProduct.findMany.mockResolvedValue([
        { name: 'Dolo 650' },
        { name: 'Calpol, 500mg' }, // name with comma — must be quoted
      ]);
      const csv = await service.generateTemplate();
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Product Name,Stock,Price');
      expect(lines[1]).toBe('"Dolo 650",,');
      expect(lines[2]).toBe('"Calpol, 500mg",,');
    });
  });

  describe('processUpload', () => {
    const sellerId = 'seller-uuid';
    const userId = 'user-uuid';

    beforeEach(() => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({ id: sellerId });
    });

    it('throws ForbiddenException when seller profile not found', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);
      const csv = Buffer.from('Product Name,Stock,Price\nDolo 650,100,28\n');
      await expect(service.processUpload(csv, userId)).rejects.toThrow(ForbiddenException);
    });

    it('skips row with blank stock', async () => {
      const csv = Buffer.from('Product Name,Stock,Price\nDolo 650,,28\n');
      const result = await service.processUpload(csv, userId);
      expect(result.skippedCount).toBe(1);
      expect(result.skipped[0].reason).toBe('missing stock or price');
      expect(result.successCount).toBe(0);
    });

    it('skips row with blank price', async () => {
      const csv = Buffer.from('Product Name,Stock,Price\nDolo 650,100,\n');
      const result = await service.processUpload(csv, userId);
      expect(result.skippedCount).toBe(1);
      expect(result.skipped[0].reason).toBe('missing stock or price');
    });

    it('skips row whose name has no master catalog match', async () => {
      mockPrisma.masterProduct.findFirst.mockResolvedValue(null);
      const csv = Buffer.from('Product Name,Stock,Price\nUnknown Product,100,28\n');
      const result = await service.processUpload(csv, userId);
      expect(result.skippedCount).toBe(1);
      expect(result.skipped[0].reason).toBe('product not in catalog');
    });

    it('skips row when seller already has a listing for that master product', async () => {
      mockPrisma.masterProduct.findFirst.mockResolvedValue({
        id: 'master-1', name: 'Dolo 650', categoryId: 'cat-1', subCategoryId: 'sub-1',
        manufacturer: 'Micro Labs', chemicalComposition: 'Paracetamol 650mg',
        gstPercent: 12, description: null, company: null,
      });
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'existing-product' });
      const csv = Buffer.from('Product Name,Stock,Price\nDolo 650,100,28\n');
      const result = await service.processUpload(csv, userId);
      expect(result.skippedCount).toBe(1);
      expect(result.skipped[0].reason).toBe('already listed');
    });

    it('creates product when name matches and no existing listing', async () => {
      mockPrisma.masterProduct.findFirst.mockResolvedValue({
        id: 'master-1', name: 'Dolo 650', categoryId: 'cat-1', subCategoryId: 'sub-1',
        manufacturer: 'Micro Labs', chemicalComposition: 'Paracetamol 650mg',
        gstPercent: 12, description: 'Pain relief', company: { name: 'Micro Labs Ltd' },
      });
      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockProductsService.create.mockResolvedValue({ id: 'new-product' });
      const csv = Buffer.from('Product Name,Stock,Price\nDolo 650,100,28\n');
      const result = await service.processUpload(csv, userId);
      expect(result.successCount).toBe(1);
      expect(result.skippedCount).toBe(0);
      expect(mockProductsService.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          masterProductId: 'master-1',
          categoryId: 'cat-1',
          subCategoryId: 'sub-1',
          manufacturer: 'Micro Labs Ltd',
          stock: 100,
          mrp: 28,
        }),
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd pharmabag-api-fix
npx jest src/modules/products/services/seller-bulk-csv.service.spec.ts --no-coverage
```

Expected: "Cannot find module './seller-bulk-csv.service'"

- [ ] **Step 3: Create the service**

Create `pharmabag-api-fix/src/modules/products/services/seller-bulk-csv.service.ts`:

```typescript
import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ProductsService } from '../products.service';
import * as csvParserModule from 'csv-parser';
const csv = (csvParserModule as any).default || csvParserModule;
import { Readable } from 'stream';

export interface SkippedRow {
  row: number;
  name: string;
  reason: 'missing stock or price' | 'product not in catalog' | 'already listed' | 'failed to create listing';
}

export interface BulkUploadResult {
  successCount: number;
  skippedCount: number;
  skipped: SkippedRow[];
}

@Injectable()
export class SellerBulkCsvService {
  private readonly logger = new Logger(SellerBulkCsvService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async generateTemplate(): Promise<string> {
    const masters = await this.prisma.masterProduct.findMany({
      where: { isActive: true, deletedAt: null },
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    const header = 'Product Name,Stock,Price';
    const rows = masters.map((m) => `"${m.name.replace(/"/g, '""')},,`);
    return [header, ...rows].join('\n');
  }

  async processUpload(buffer: Buffer, userId: string): Promise<BulkUploadResult> {
    const seller = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (!seller) throw new ForbiddenException('Seller profile not found');

    const rows = await this.parseCsv(buffer);
    if (rows.length === 0) throw new BadRequestException('CSV has no data rows');

    const result: BulkUploadResult = { successCount: 0, skippedCount: 0, skipped: [] };
    const defaultExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    for (const [index, row] of rows.entries()) {
      const rowNum = index + 2;
      const name = row['Product Name']?.trim();
      const stockRaw = row['Stock']?.trim();
      const priceRaw = row['Price']?.trim();

      if (!name || !stockRaw || !priceRaw) {
        result.skippedCount++;
        result.skipped.push({ row: rowNum, name: name || '(blank)', reason: 'missing stock or price' });
        continue;
      }

      const stock = parseInt(stockRaw, 10);
      const price = parseFloat(priceRaw);

      if (isNaN(stock) || isNaN(price) || stock < 0 || price <= 0) {
        result.skippedCount++;
        result.skipped.push({ row: rowNum, name, reason: 'missing stock or price' });
        continue;
      }

      const master = await this.prisma.masterProduct.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, isActive: true, deletedAt: null },
        include: { company: { select: { name: true } } },
      });

      if (!master) {
        result.skippedCount++;
        result.skipped.push({ row: rowNum, name, reason: 'product not in catalog' });
        continue;
      }

      const existing = await this.prisma.product.findFirst({
        where: { sellerId: seller.id, masterProductId: master.id, deletedAt: null },
      });

      if (existing) {
        result.skippedCount++;
        result.skipped.push({ row: rowNum, name, reason: 'already listed' });
        continue;
      }

      try {
        await this.productsService.create(userId, {
          name: master.name,
          masterProductId: master.id,
          categoryId: master.categoryId,
          subCategoryId: master.subCategoryId,
          manufacturer: master.company?.name ?? master.manufacturer ?? 'N/A',
          chemicalComposition: master.chemicalComposition ?? 'N/A',
          description: master.description ?? undefined,
          mrp: price,
          gstPercent: master.gstPercent ?? 0,
          stock,
          expiryDate: defaultExpiry,
          isMigration: true,
        });
        result.successCount++;
      } catch (err) {
        result.skippedCount++;
        result.skipped.push({ row: rowNum, name, reason: 'failed to create listing' });
        this.logger.warn(`Bulk CSV row ${rowNum} failed: ${(err as Error).message}`);
      }
    }

    return result;
  }

  private parseCsv(buffer: Buffer): Promise<Record<string, string>[]> {
    const rows: Record<string, string>[] = [];
    const stream = Readable.from(buffer.toString());
    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row: Record<string, string>) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', (err: Error) =>
          reject(new BadRequestException(`Failed to parse CSV: ${err.message}`)),
        );
    });
  }
}
```

- [ ] **Step 4: Fix the template row generation bug**

The `rows.map` line above has a bug — the closing `"` is inside the template literal. Fix it:

```typescript
// Replace this line in generateTemplate():
const rows = masters.map((m) => `"${m.name.replace(/"/g, '""')},,`);

// With:
const rows = masters.map((m) => `"${m.name.replace(/"/g, '""')}",,`);
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd pharmabag-api-fix
npx jest src/modules/products/services/seller-bulk-csv.service.spec.ts --no-coverage
```

Expected: 8 tests pass

- [ ] **Step 6: Commit**

```bash
cd pharmabag-api-fix
git add src/modules/products/services/seller-bulk-csv.service.ts src/modules/products/services/seller-bulk-csv.service.spec.ts
git -c user.email="server@theeraofmarketing.com" -c user.name="The Era of Marketing" commit -m "feat(api): add SellerBulkCsvService for CSV template generation and upload processing"
```

---

## Task 2: SellerBulkCsvController — HTTP layer

**File:** `pharmabag-api-fix/src/modules/products/seller-bulk-csv.controller.ts`

- [ ] **Step 1: Create the controller**

```typescript
import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Express, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { SellerBulkCsvService } from './services/seller-bulk-csv.service';

@ApiTags('Seller Bulk CSV')
@Controller('products/bulk-csv')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
@ApiBearerAuth('JWT-auth')
export class SellerBulkCsvController {
  constructor(private readonly bulkCsvService: SellerBulkCsvService) {}

  @Get('template')
  @ApiOperation({ summary: 'Download master catalog as a CSV template for bulk upload' })
  async downloadTemplate(@Res() res: Response) {
    try {
      const csv = await this.bulkCsvService.generateTemplate();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=pharmabag-product-template.csv');
      res.status(HttpStatus.OK).send(csv);
    } catch {
      throw new HttpException('Failed to generate template', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk upload seller products via CSV (name must match master catalog)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new HttpException('CSV file is required', HttpStatus.BAD_REQUEST);
    }
    const result = await this.bulkCsvService.processUpload(file.buffer, userId);
    return { message: 'Bulk upload processed', data: result };
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd pharmabag-api-fix
git add src/modules/products/seller-bulk-csv.controller.ts
git -c user.email="server@theeraofmarketing.com" -c user.name="The Era of Marketing" commit -m "feat(api): add SellerBulkCsvController with template download and CSV upload endpoints"
```

---

## Task 3: Wire controller and service into ProductsModule

**File:** `pharmabag-api-fix/src/modules/products/products.module.ts`

- [ ] **Step 1: Update the module**

Replace the entire file contents with:

```typescript
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { InventoryService } from './services/inventory.service';
import { SearchIndexService } from './services/search-index.service';
import { AnalyticsService } from './services/analytics.service';
import { MasterProductsBulkController } from './master-products-bulk.controller';
import { MasterProductsBulkService } from './services/master-products-bulk.service';
import { SellerBulkCsvController } from './seller-bulk-csv.controller';
import { SellerBulkCsvService } from './services/seller-bulk-csv.service';

@Module({
  controllers: [ProductsController, MasterProductsBulkController, SellerBulkCsvController],
  providers: [
    ProductsService,
    InventoryService,
    SearchIndexService,
    AnalyticsService,
    MasterProductsBulkService,
    SellerBulkCsvService,
  ],
  exports: [ProductsService, InventoryService, AnalyticsService, MasterProductsBulkService],
})
export class ProductsModule {}
```

- [ ] **Step 2: Build the API to confirm no TypeScript errors**

```bash
cd pharmabag-api-fix
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd pharmabag-api-fix
git add src/modules/products/products.module.ts
git -c user.email="server@theeraofmarketing.com" -c user.name="The Era of Marketing" commit -m "feat(api): wire SellerBulkCsvController and SellerBulkCsvService into ProductsModule"
```

---

## Task 4: Frontend API functions

**File:** `pharmabag-web/apps/seller/api/seller.api.ts`

Add two functions at the bottom of the file, after the existing `getCategoriesWithSubs` function.

- [ ] **Step 1: Add the BulkUploadResult type and API functions**

Append to the end of `apps/seller/api/seller.api.ts`:

```typescript
// ─── Seller Bulk CSV Upload ────────────────────────────

export interface BulkUploadResult {
  successCount: number;
  skippedCount: number;
  skipped: Array<{
    row: number;
    name: string;
    reason: 'missing stock or price' | 'product not in catalog' | 'already listed' | 'failed to create listing';
  }>;
}

export async function downloadBulkTemplate(): Promise<void> {
  const response = await apiClient.get('/products/bulk-csv/template', {
    responseType: 'blob',
    timeout: 0,
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'pharmabag-product-template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function uploadBulkCsv(file: File): Promise<BulkUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<{ data: BulkUploadResult }>(
    '/products/bulk-csv/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 },
  );
  return response.data.data;
}
```

- [ ] **Step 2: Commit**

```bash
cd pharmabag-web
git -c user.email="server@theeraofmarketing.com" -c user.name="The Era of Marketing" commit -m "feat(seller): add downloadBulkTemplate and uploadBulkCsv API functions" apps/seller/api/seller.api.ts
```

---

## Task 5: Frontend hooks

**File:** `pharmabag-web/apps/seller/hooks/useSellerBulkUpload.ts`

- [ ] **Step 1: Create the hook file**

```typescript
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { downloadBulkTemplate, uploadBulkCsv, type BulkUploadResult } from "@/api/seller.api";

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: downloadBulkTemplate,
    onError: () => toast.error("Failed to download template"),
  });
}

export function useUploadBulkCsv() {
  const qc = useQueryClient();
  return useMutation<BulkUploadResult, Error, File>({
    mutationFn: uploadBulkCsv,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["seller", "products"] });
    },
    onError: () => toast.error("Upload failed. Please try again."),
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd pharmabag-web
git -c user.email="server@theeraofmarketing.com" -c user.name="The Era of Marketing" commit -m "feat(seller): add useDownloadTemplate and useUploadBulkCsv hooks" apps/seller/hooks/useSellerBulkUpload.ts
```

---

## Task 6: Bulk upload page

**File:** `pharmabag-web/apps/seller/app/products/bulk-upload/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import Link from "next/link";
import toast from "react-hot-toast";
import { useDownloadTemplate, useUploadBulkCsv } from "@/hooks/useSellerBulkUpload";
import type { BulkUploadResult } from "@/api/seller.api";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = useDownloadTemplate();
  const uploadCsv = useUploadBulkCsv();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    setFile(selected);
    setResults(null);
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a CSV file first'); return; }
    const result = await uploadCsv.mutateAsync(file);
    setResults(result);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success(`${result.successCount} products uploaded`);
  };

  const handleReset = () => { setResults(null); setFile(null); };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/products" className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent/60 transition-colors text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Bulk Upload Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload multiple products at once using a CSV file</p>
        </div>
      </div>

      {!results ? (
        <>
          {/* Step 1 */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</div>
              <h2 className="font-semibold text-foreground">Download the template</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              The template contains all products from our master catalog. Fill in the <strong>Stock</strong> and <strong>Price</strong> columns for the products you want to list. Do not edit the Product Name column.
            </p>
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => downloadTemplate.mutate()}
              loading={downloadTemplate.isPending}
            >
              Download Template CSV
            </Button>
          </div>

          {/* Step 2 */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</div>
              <h2 className="font-semibold text-foreground">Upload your filled CSV</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Only rows with a Stock and Price filled in will be uploaded. Rows whose product name doesn't match the catalog exactly will be skipped and shown in a report.
            </p>

            <div
              className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <FileSpreadsheet className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">Click to select a CSV file</p>
              <p className="text-xs text-muted-foreground">Only .csv files accepted</p>
              {file && (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium bg-background px-4 py-2 rounded-lg border border-border">
                  <FileSpreadsheet className="h-4 w-4 text-green-500" />
                  {file.name}
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

            <div className="flex justify-end">
              <Button
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={handleUpload}
                disabled={!file}
                loading={uploadCsv.isPending}
              >
                {uploadCsv.isPending ? 'Uploading…' : 'Upload CSV'}
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* Results Panel */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/10 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-400">Successfully Uploaded</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{results.successCount}</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/10 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-orange-700 dark:text-orange-400">Rows Skipped</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{results.skippedCount}</p>
              </div>
            </div>
          </div>

          {results.skipped.length > 0 && (
            <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/50 bg-muted/20">
                <h3 className="text-sm font-semibold text-foreground">Skipped Rows</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Fix these in your CSV and re-upload</p>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/10">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Row</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Name</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {results.skipped.map((s) => (
                      <tr key={`${s.row}-${s.name}`} className="hover:bg-accent/20 transition-colors">
                        <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{s.row}</td>
                        <td className="px-5 py-3 font-medium text-foreground max-w-[240px] truncate" title={s.name}>{s.name}</td>
                        <td className="px-5 py-3 text-muted-foreground capitalize text-xs">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleReset}>Upload Another CSV</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd pharmabag-web
git -c user.email="server@theeraofmarketing.com" -c user.name="The Era of Marketing" commit -m "feat(seller): add bulk upload page with template download, CSV upload, and skipped rows report" apps/seller/app/products/bulk-upload/page.tsx
```

---

## Task 7: Add Bulk Upload button to Products page

**File:** `pharmabag-web/apps/seller/app/products/page.tsx`

- [ ] **Step 1: Add the Upload icon import and button**

In `apps/seller/app/products/page.tsx`, the existing imports line includes `{ Plus, Search, Edit, Trash2, Eye }` from lucide-react. Add `Upload` to that import:

```typescript
// Change:
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
// To:
import { Plus, Search, Edit, Trash2, Eye, Upload } from "lucide-react";
```

Then in the header `div` that contains the "Request Product" and "Add Product" buttons, add the "Bulk Upload" button before "Request Product":

```typescript
// Find this block:
<div className="flex items-center gap-3">
  <Link href="/products/requests">
    <Button variant="secondary" leftIcon={<FileText className="h-4 w-4"/>}>Request Product</Button>
  </Link>
  <Link href="/products/new">
    <Button leftIcon={<Plus className="h-4 w-4"/>}>Add Product</Button>
  </Link>
</div>

// Replace with:
<div className="flex items-center gap-3">
  <Link href="/products/bulk-upload">
    <Button variant="secondary" leftIcon={<Upload className="h-4 w-4"/>}>Bulk Upload</Button>
  </Link>
  <Link href="/products/requests">
    <Button variant="secondary" leftIcon={<FileText className="h-4 w-4"/>}>Request Product</Button>
  </Link>
  <Link href="/products/new">
    <Button leftIcon={<Plus className="h-4 w-4"/>}>Add Product</Button>
  </Link>
</div>
```

- [ ] **Step 2: TypeScript check**

```bash
cd pharmabag-web
npx tsc --noEmit -p apps/seller/tsconfig.json
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd pharmabag-web
git -c user.email="server@theeraofmarketing.com" -c user.name="The Era of Marketing" commit -m "feat(seller): add Bulk Upload button to products page header" apps/seller/app/products/page.tsx
```

---

## Task 8: Manual end-to-end test

Before deploying, verify the full flow works locally.

- [ ] **Step 1: Start the API**

```bash
cd pharmabag-api-fix
npm run start:dev
```

- [ ] **Step 2: Get a seller JWT**

Log in as a seller on the local seller app and copy the token from `localStorage.pb_access_token` in browser devtools.

- [ ] **Step 3: Test template download**

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/products/bulk-csv/template \
  --output template.csv
head -5 template.csv
```

Expected: first line is `Product Name,Stock,Price`, subsequent lines are quoted product names with two trailing commas.

- [ ] **Step 4: Fill in a test CSV**

Edit `template.csv` — find one product name you know exists in the master catalog and one that doesn't. Fill in stock and price for the known one, leave the unknown one with data too.

Example `test-upload.csv`:
```
Product Name,Stock,Price
Dolo 650,50,27.50
This Product Does Not Exist,10,100
```

- [ ] **Step 5: Test the upload endpoint**

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-upload.csv" \
  http://localhost:3000/products/bulk-csv/upload
```

Expected response:
```json
{
  "message": "Bulk upload processed",
  "data": {
    "successCount": 1,
    "skippedCount": 1,
    "skipped": [
      { "row": 3, "name": "This Product Does Not Exist", "reason": "product not in catalog" }
    ]
  }
}
```

- [ ] **Step 6: Verify in seller portal UI**

Navigate to `/products/bulk-upload` in the seller app. Download the template, fill in one valid and one invalid product name with stock/price, upload it, and confirm:
- Success count and skipped count are correct
- Skipped rows table shows the invalid row with the right reason
- The successfully uploaded product appears in `/products`

---

## Self-Review Notes

**Spec coverage check:**
- Template download (GET /products/bulk-csv/template) → Task 2 ✓
- CSV upload with name matching (POST /products/bulk-csv/upload) → Tasks 1+2 ✓
- Partial upload (skip bad rows, upload good ones) → Task 1 service logic ✓
- Skipped rows report → Task 1 BulkUploadResult + Task 6 results panel ✓
- Seller fills Stock and Price only, rest from master → Task 1 processUpload ✓
- Already listed = skip → Task 1 duplicate check ✓
- Blank stock/price = skip → Task 1 validation ✓
- Bulk Upload button on products page → Task 7 ✓
- SELLER role guard on both endpoints → Task 2 ✓

**No placeholders detected.**
