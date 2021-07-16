export interface PublicationInterface {
  name: string;
  publisher: string;
  issue: Date;
  keywords?: string[];
  type: 'newspaper' | 'magazine';
}