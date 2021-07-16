import { PublicationInterface } from './Publication';
import { BookInterface } from './Book';

export interface LibraryInterface {
  books: BookInterface[];
  publications: PublicationInterface[];
}