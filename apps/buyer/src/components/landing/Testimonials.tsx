'use client';

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    quote:
      "Since joining PharmaBag, sourcing medicines in bulk has become much faster and more transparent. The platform saves us hours every week by connecting us with trusted suppliers across India. We've expanded our product range while keeping procurement costs under control.",
    name: 'Rajesh Agarwal',
    role: 'Owner, Shree Balaji Pharma Distributors – Jaipur',
    avatar: '/testimonials/rajesh-agarwal.png',
  },
  {
    id: 2,
    quote:
      "As an independent pharmacy owner, finding reliable wholesalers at competitive prices was always a challenge. PharmaBag has simplified the entire buying process. The ordering experience is smooth, deliveries are timely, and we've seen a noticeable improvement in inventory management.",
    name: 'Priya Nair',
    role: 'Owner, MedCare Pharmacy – Kochi',
    avatar: '/testimonials/priya-nair.png',
  },
  {
    id: 3,
    quote:
      "PharmaBag has become an important part of our procurement process. The wide selection of brands, competitive B2B pricing, and easy ordering system help us serve our retail partners more efficiently. It's a platform we rely on for consistent business growth.",
    name: 'Amit Patel',
    role: 'Director, Patel Healthcare Distributors – Ahmedabad',
    avatar: '/testimonials/amit-patel.png',
  },
];

export default function Testimonials() {
  return (
    <div className="pt-8 md:pt-12 lg:pt-16 pb-16 sm:pb-24 md:pb-32 lg:pb-40 px-[4vw]">
      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 sm:gap-12 md:gap-16 lg:gap-24">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.id}
              className="group transition-all duration-300"
            >
              {/* Avatar */}
              <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>

              {/* Quote */}
              <p className="text-base sm:text-lg font-light text-gray-600 text-center mb-4 sm:mb-6 md:mb-8 leading-relaxed tracking-wide">
                {testimonial.quote}
              </p>

              {/* Name & Role */}
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-base sm:text-lg">{testimonial.name}</p>
                <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider mt-1">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
