"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, FileText, MapPin, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button, Input, Badge } from "@/components/ui";
import { verifyGstOrPan, uploadKycDocument, onboardBuyer } from "@/api/seller.api";
import toast from "react-hot-toast";

export default function BuyerOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<"form" | "verification" | "review">("form");
  const [useGst, setUseGst] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [gstPanResponse, setGstPanResponse] = useState<any>(null);

  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    email: "",
    legalName: "",
    gstNumber: "",
    panNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: 0,
    longitude: 0,
    drugLicenseNumber: "",
    drugLicenseUrl: "",
    inviteCode: "",
    licence: [] as string[],
    bankAccount: {} as Record<string, any>,
    cancelCheck: "",
    document: "",
  });

  const [files, setFiles] = useState({
    licence: [] as File[],
    bankStatement: null as File | null,
    cancelCheck: null as File | null,
    document: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    if (field === "licence" && e.target.files) {
      setFiles((prev) => ({ ...prev, licence: Array.from(e.target.files || []) }));
    } else if (e.target.files?.[0]) {
      setFiles((prev) => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleVerify = async () => {
    const value = useGst ? formData.gstNumber : formData.panNumber;
    const type = useGst ? "GST" : "PAN";

    if (!value) {
      toast.error(`Please enter ${type} number`);
      return;
    }

    setVerifying(true);
    try {
      const response = await verifyGstOrPan(type, value);
      if (response?.status) {
        setGstPanResponse(response);
        setCurrentStep("review");
        toast.success(`${type} verified successfully!`);
      } else {
        toast.error(`${type} verification failed: ${response?.message || "Unknown error"}`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to verify ${type}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone) return toast.error("Phone number is required");
    if (!formData.name) return toast.error("Buyer name is required");
    if (!formData.legalName) return toast.error("Legal name is required");
    if (!gstPanResponse) return toast.error("Please verify GST or PAN first");
    if (!formData.city || !formData.state || !formData.pincode) {
      return toast.error("Address (city, state, pincode) is required");
    }

    setLoading(true);
    try {
      // Upload files if any
      let licenceUrls: string[] = [];
      let bankAccountData: any = null;
      let cancelCheckUrl: string | null = null;
      let documentUrl: string | null = null;

      // Upload licence files
      if (files.licence.length > 0) {
        for (const file of files.licence) {
          const formDataObj = new FormData();
          formDataObj.append("file", file);
          formDataObj.append("type", "licence");
          try {
            const result = await uploadKycDocument(formDataObj);
            if (result?.url) licenceUrls.push(result.url);
          } catch (err) {
            console.warn("Failed to upload licence file:", err);
          }
        }
      }

      // Upload bank statement
      if (files.bankStatement) {
        const formDataObj = new FormData();
        formDataObj.append("file", files.bankStatement);
        formDataObj.append("type", "bank");
        try {
          const result = await uploadKycDocument(formDataObj);
          if (result?.url) {
            bankAccountData = {
              bankName: "Uploaded",
              accountNumber: "****",
              statementUrl: result.url,
            };
          }
        } catch (err) {
          console.warn("Failed to upload bank statement:", err);
        }
      }

      // Upload cancel check
      if (files.cancelCheck) {
        const formDataObj = new FormData();
        formDataObj.append("file", files.cancelCheck);
        formDataObj.append("type", "cancel_cheque");
        try {
          const result = await uploadKycDocument(formDataObj);
          if (result?.url) cancelCheckUrl = result.url;
        } catch (err) {
          console.warn("Failed to upload cancel check:", err);
        }
      }

      // Upload document
      if (files.document) {
        const formDataObj = new FormData();
        formDataObj.append("file", files.document);
        formDataObj.append("type", "document");
        try {
          const result = await uploadKycDocument(formDataObj);
          if (result?.url) documentUrl = result.url;
        } catch (err) {
          console.warn("Failed to upload document:", err);
        }
      }

      // Prepare payload
      const payload = {
        phone: formData.phone,
        name: formData.name,
        email: formData.email || undefined,
        legalName: formData.legalName,
        gstNumber: useGst ? formData.gstNumber : undefined,
        panNumber: !useGst ? formData.panNumber : undefined,
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: formData.latitude || 0,
        longitude: formData.longitude || 0,
        drugLicenseNumber: formData.drugLicenseNumber || undefined,
        drugLicenseUrl: formData.drugLicenseUrl || undefined,
        inviteCode: formData.inviteCode || undefined,
        licence: licenceUrls.length > 0 ? licenceUrls : undefined,
        bankAccount: bankAccountData || undefined,
        cancelCheck: cancelCheckUrl || undefined,
        document: documentUrl || undefined,
        gstPanResponse,
      };

      // Call onboard API
      const result = await onboardBuyer(payload);
      
      toast.success("Buyer onboarded successfully!");
      router.push("/buyers");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to onboard buyer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Onboard a Buyer</h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Add your buyer's details and verify their GST or PAN for KYC compliance.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 justify-center mb-8">
          {["form", "verification", "review"].map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              <motion.div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  ["form", "verification", "review"].indexOf(currentStep) >= idx
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {idx + 1}
              </motion.div>
              {idx < 2 && <div className="h-0.5 w-8 bg-muted" />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {currentStep === "form" && (
              <>
                {/* Contact Information */}
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      required
                    />
                    <Input
                      label="Buyer Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Pharmacy"
                      required
                    />
                  </div>
                  <Input
                    label="Email (optional)"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="buyer@example.com"
                  />
                </div>

                {/* Legal Information */}
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Legal Information</h2>
                  <Input
                    label="Legal Business Name"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleChange}
                    placeholder="ABC Pharmacy Private Limited"
                    required
                  />
                </div>

                {/* GST/PAN Toggle */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Tax Identification</h2>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setUseGst(true)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          useGst
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        GST
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseGst(false)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          !useGst
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        PAN
                      </button>
                    </div>
                  </div>

                  {useGst ? (
                    <Input
                      label="GST Number"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      placeholder="27AABCU9603R1ZM"
                      maxLength={15}
                      className="uppercase"
                      required
                    />
                  ) : (
                    <Input
                      label="PAN Number"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleChange}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className="uppercase"
                      required
                    />
                  )}
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Address</h2>
                  </div>
                  <Input
                    label="Street Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main Street, Suite 100"
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      required
                    />
                    <Input
                      label="State"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Maharashtra"
                      required
                    />
                    <Input
                      label="Pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="400001"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-6 border-t border-border/50 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep("verification")}
                    size="lg"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Continue to Verification
                  </Button>
                </div>
              </>
            )}

            {currentStep === "verification" && (
              <>
                {/* Verification Section */}
                <div className="space-y-6">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Verify the {useGst ? "GST" : "PAN"} number to proceed with buyer onboarding.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">
                        {useGst ? "GST Number" : "PAN Number"}
                      </p>
                      <p className="text-lg font-semibold">
                        {useGst ? formData.gstNumber : formData.panNumber}
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleVerify}
                      loading={verifying}
                      className="w-full"
                      size="lg"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        `Verify ${useGst ? "GST" : "PAN"}`
                      )}
                    </Button>

                    {gstPanResponse && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Verification Successful!
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                              The {useGst ? "GST" : "PAN"} details have been verified successfully.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-border/50 flex gap-4 justify-between">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep("form")}
                    variant="outline"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => gstPanResponse && setCurrentStep("review")}
                    disabled={!gstPanResponse}
                    size="lg"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Continue to Review
                  </Button>
                </div>
              </>
            )}

            {currentStep === "review" && (
              <>
                {/* Review Summary */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Buyer Name</p>
                      <p className="font-semibold mt-1">{formData.name}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-semibold mt-1">{formData.phone}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        {useGst ? "GST Number" : "PAN Number"}
                      </p>
                      <p className="font-semibold mt-1">
                        {useGst ? formData.gstNumber : formData.panNumber}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-semibold mt-1">
                        {formData.city}, {formData.state}
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Ready to Onboard
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          All information has been verified. Click submit to complete the onboarding process.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-border/50 flex gap-4 justify-between">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep("verification")}
                    variant="outline"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    size="lg"
                    rightIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Submit & Onboard Buyer
                  </Button>
                </div>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
