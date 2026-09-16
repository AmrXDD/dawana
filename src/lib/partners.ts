/**
 * Manufacturing partners, as shown on the "Our Partners" slide of the
 * company profile. Logos were lifted from that slide into /public/partners
 * with their transparency intact.
 */

export interface PartnerLogo {
  name: string;
  logo: string;
}

const logo = (slug: string, name: string): PartnerLogo => ({
  name,
  logo: `/partners/${slug}.png`,
});

export const PARTNER_LOGOS: readonly PartnerLogo[] = [
  logo("bebina", "Bebina"),
  logo("bluem", "bluem"),
  logo("biomed", "Biomed Pharma"),
  logo("brudylab", "Brudylab"),
  logo("camoleon", "Camoleon"),
  logo("coswell", "Coswell"),
  logo("crevil", "Crevil Germany"),
  logo("gp", "GP"),
  logo("hager-werken", "Hager & Werken"),
  logo("ibn-al-haytham", "Ibn Al Haytham Pharma"),
  logo("hydra-egypt", "Hydra Egypt"),
  logo("mediunion", "Mediunion"),
  logo("medico-labs", "Medico Labs"),
  logo("miradent", "Miradent"),
  logo("novatec", "Novatec Healthcare"),
  logo("swiss-energy", "Swiss Energy"),
  logo("ultra-medica", "Ultra Medica"),
  logo("west-coast", "West-Coast Pharmaceutical Works"),
  logo("wug", "WUG"),
  logo("zahr", "Zahr"),
];
