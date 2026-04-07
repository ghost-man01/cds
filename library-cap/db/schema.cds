using { cuid, managed } from '@sap/cds/common';
using { AuditInfo } from './aspects';

namespace library;

entity Authors : cuid, managed, AuditInfo {
    name        : String;
    country     : String;

    books       : Composition of many Books
                    on books.author = $self;
}

entity Books : cuid, managed {
    title       : String;
    stock       : Integer;

    author      : Association to Authors;
    publisher   : Association to Publishers;
}

entity Publishers : cuid {
    name        : String;
    location    : String;
}