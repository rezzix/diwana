export interface CompanyDto {
  id: number;
  name: string;
  key: string;
  description: string | null;
  ice: string | null;
  rc: string | null;
  nif: string | null;
  vatNumber: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  bankIban: string | null;
  bankSwift: string | null;
  customsCode: string | null;
  active: boolean;
}
