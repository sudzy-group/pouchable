/**
 * Represents a resource in the system
 */
import * as PouchDB from 'pouchdb';
import { map } from 'lodash';
import { EntityBase } from './EntityBase'
import { EntityCollectionBase } from './EntityCollectionBase';

/**
 * Base class of the different resources in the system
 */
export class Repository {
    
    private _db: PouchDb;

    private _collection : EntityCollectionBase;

    private constructor(name: string) {
        this._db = new PouchDB("default");
        this._collection = new EntityCollectionBase(name, this._db);
    }

    public static create(name) {
        return new Repository(name);
    }

    public new(core) {
        return this._collection.insert(core);
    }

}