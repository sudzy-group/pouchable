import {Injectable} from '@angular/core';
import PouchDB from 'pouchdb';

@Injectable()
export class DbService {

    constructor() {
        let db = new PouchDB('database');
        // ...
    }
}
