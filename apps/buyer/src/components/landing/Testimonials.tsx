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
      "This is your Testimonial section paragraph. It's a great place to tell users. This is your Testimonial section paragraph. It's a great place to tell users",
    name: 'Alex Smith',
    role: 'Medicine Retailer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  },
  {
    id: 2,
    quote:
      "This is your Testimonial section paragraph. It's a great place to tell users. This is your Testimonial section paragraph. It's a great place to tell users",
    name: 'Drew Carlyle',
    role: 'Shop Owner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Drew',
  },
  {
    id: 3,
    quote:
      "This is your Testimonial section paragraph. It's a great place to tell users. This is your Testimonial section paragraph. It's a great place to tell users",
    name: 'Jane Doe',
    role: 'Pharmacy Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
  },
];

export default function Testimonials() {
  return (
    <div className="py-40 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-20 md:gap-32">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.id}
              className="group transition-all duration-300"
            >
              {/* Avatar */}
              <div className="flex justify-center mb-8">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>

              {/* Quote */}
              <p className="text-lg md:text-xl font-light text-gray-600 text-center mb-8 leading-relaxed tracking-wide">
                {testimonial.quote}
              </p>

              {/* Name & Role */}
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-lg">{testimonial.name}</p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-1">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
