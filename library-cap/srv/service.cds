using library from '../db/schema';

service LibraryService {

    entity Books as projection on library.Books;

}

annotate LibraryService.Books with {
    title @Common.Label : 'Book Title';
    stock @UI.LineItem : [{ position: 10 }];
};