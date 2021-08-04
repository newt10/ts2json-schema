/**
 * @additionalProperties true
 */
export interface BookInterface {
  name: string;
  author: string;
  publisher: string;
  keywords?: string[];
  /**
   * @pattern ^[0-9a-fA-F]+$
   */
  barCode: string;
  /**
   * @minimum 0
   * @default 0
   */
  price: number;
}