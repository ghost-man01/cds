using library from './schema';

view BookWithPublisher as select from library.Books
mixin {
    pub : Association to library.Publishers
        on pub.ID = publisher.ID;
}
into {
    ID,
    title,
    pub.name as publisherName
};