/**
 * Single source of truth for company facts + brand constants.
 * Everything here is transcribed from the Dawana Company Profile (Q1 2026)
 * and the "Beyond The Logo" brand book — do not invent values here.
 */

export const BRAND = {
  name: "Dawana",
  legalName: "Dawana General Trading Co.",
  tagline: "Your Everyday Remedy",
  founded: 2015,
  domain: "dawa-na.com",
  url: "https://www.dawa-na.com",
} as const;

/** Palette exactly as specified on the brand book colour page. */
export const PALETTE = {
  white: "#ffffff",
  mint: "#5cbca7",
  deep: "#035a51",
  black: "#000000",
} as const;

export const CONTACT = {
  phonePrimary: "+965 2225 5909",
  phoneSecondary: "+965 2226 7561",
  mobile: "+965 6902 8591",
  email: "dawana@dawa-na.com",
  emailDirector: "Dr.Bisher@dawa_na.com",
  instagram: "@Dawana.in",
  instagramUrl: "https://instagram.com/dawana.in",
  address: "Kuwait City, Sharq, Arabiya Tower 17F",
  city: "Kuwait City",
  country: "Kuwait",
} as const;

export const SIGNATORY = {
  name: "Bisher Alemam",
  title: "Managing Director",
} as const;

export const ABOUT = {
  lede:
    "Dawana was born in 2015. Built on more than 25 years of experience, our leadership team brings deep expertise and a forward-thinking approach to the healthcare sector in Kuwait.",
  body:
    "Since our inception, we have focused on delivering high-quality pharmaceutical solutions, strengthening trusted partnerships, and driving innovation across the market. Today, Dawana stands as a reliable name in the private and government sectors in the State of Kuwait, recognised for its integrity, performance, and commitment to excellence.",
} as const;

export const MISSION = {
  title: "Mission",
  body:
    "Our mission is to fulfil the market needs with innovative products that acquire a high demand and demolish the shortage of medical needs. We aim to satisfy our customers with superior quality, develop our employees' skills, knowledge and experience, and achieve sustainable growth in a challenging business environment.",
} as const;

export const VISION = {
  title: "Vision",
  body:
    "Our vision is to establish ourselves as the premier healthcare solutions provider in the MENA region, working hand in hand with our innovative brands to deliver reliable and affordable services. We aspire to be recognised for excellence and trust, to strengthen our partnerships across the region, and to continuously enhance the value we provide to our customers.",
} as const;

export const VALUES = [
  {
    id: "dedication",
    title: "Dedication",
    body: "Dedication and passion to serve our clients' success.",
  },
  {
    id: "flexibility",
    title: "Flexibility",
    body: "Flexibility in managing our strategies to match market changes.",
  },
  {
    id: "innovation",
    title: "Innovation",
    body: "Innovation and development to lead the market.",
  },
  {
    id: "environment",
    title: "Environment",
    body: "Providing an appropriate environment for staff development.",
  },
  {
    id: "quality",
    title: "Quality",
    body: "Quality as the best after-sales service.",
  },
  {
    id: "stability",
    title: "Stability",
    body: "Stable performance in all market situations.",
  },
] as const;

/** The six therapeutic areas listed under "Our Services". */
export const THERAPEUTIC_AREAS = [
  {
    id: "mom-and-baby",
    name: "Mom & Baby Care",
    blurb:
      "Maternal and infant nutrition, supplementation and daily-care lines built for the most sensitive stage of life.",
    index: "01",
  },
  {
    id: "diabetes",
    name: "Diabetes",
    blurb:
      "Glycaemic management and monitoring support for one of the region's most prevalent chronic conditions.",
    index: "02",
  },
  {
    id: "neurology",
    name: "Neurology",
    blurb:
      "Neurological and cognitive-health therapies sourced from partners with deep clinical pedigree.",
    index: "03",
  },
  {
    id: "nutraceuticals",
    name: "Nutraceuticals",
    blurb:
      "Evidence-led supplementation — vitamins, minerals and functional formulations for everyday wellbeing.",
    index: "04",
  },
  {
    id: "ophthalmology",
    name: "Ophthalmology",
    blurb:
      "Ocular care, dry-eye management and vision-support products for clinic and pharmacy channels.",
    index: "05",
  },
  {
    id: "oral-care",
    name: "Oral Care",
    blurb:
      "Preventive and therapeutic oral-health ranges for dental practices and retail pharmacy.",
    index: "06",
  },
] as const;

/** Departments from the company structure chart. */
export const DEPARTMENTS = [
  "Legal & Contract Management",
  "Finance & Accounting",
  "Collection",
  "Sales",
  "Marketing",
  "Human Resources",
  "Tenders",
  "Supply Chain",
  "Procurement",
  "Modern Trade",
] as const;

/** Channels Dawana serves — stated in the profile as private + government. */
export const CHANNELS = [
  {
    id: "government",
    title: "Government Tenders",
    body:
      "A dedicated tenders department managing registration, submission and fulfilment across Kuwait's public health institutions.",
  },
  {
    id: "private",
    title: "Private Sector",
    body:
      "Hospitals, polyclinics and private pharmacy groups supported by medical and sales representatives in the field.",
  },
  {
    id: "modern-trade",
    title: "Modern Trade",
    body:
      "Promoters and merchandisers driving visibility and sell-through across retail pharmacy chains and co-operatives.",
  },
] as const;

export const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/therapeutics", label: "Therapeutics" },
  { href: "/products", label: "Products" },
  { href: "/partners", label: "Partners" },
  { href: "/contact", label: "Contact" },
] as const;
