/**
 * Base class for entity, which is the building block of the data structure.
 * Each entity holds one main coreument representing an instance of the entity
 * and sub coreuments that hold metadata and search terms for this entity.
 */
import * as PouchDB from 'pouchdb';
import { indexOf, map, intersection, assign, omitBy, isNil, findIndex } from 'lodash';
import { EntityCollection } from './EntityCollection'

/**
 * Each entity instance is
 */
export class Entity {

    /**
     * @var the collection
     */
    protected _collection : EntityCollection;

    /**
     * Unique id for this entity
     */
    protected _id : string;

    /**
     * @var the main doc of this entity
     */
    public core;

    /**
     * @var the decorator objects
     */
    public decorators : any[];

    /**
     * @var the search keys objects
     */
    public search_keys_ref : any[];

    constructor(collection: EntityCollection, id : string, core: any, decorators?: any[], search_keys_ref?: any[]) {
        if (!core) {
            throw new TypeError("Missing type or db");
        }

        this._collection = collection;
        this._id = id;
        this.core = core;
        this.decorators = decorators || [] ;
        this.search_keys_ref = search_keys_ref || [];
    }

    addDecorator(store: string, decorator: any) {
        if (!store || !decorator) {
            throw new Error("unable to add store-less, empty decorator");
        }

        let existing_stores = map(this.decorators, 'store');
        let conflict = indexOf(existing_stores, store);
        if (conflict >= 0) {
            throw new Error("unable to add existing decorator. (" + store + ")");
        }

        decorator._id = this._collection.prefix + this._id + '/' + store;
        decorator._added = true;
        decorator.store = store;
        this.decorators.push(decorator);
    }

    updateDecorator(store: string, decorator: any) {
        if (!store || !decorator) {
            throw new Error("unable to add store-less, empty decorator");
        }
        let existing_stores = map(this.decorators, 'store');
        let index = indexOf(existing_stores, store);
        if (index == -1) {
            throw new Error("unable to update missing decorator, use add instead (" + store + ")");
        }
        assign(this.decorators[index], decorator);
        omitBy(this.decorators[index], isNil);

        // if recently added just do the add, otherwise mark for update
        if (!this.decorators[index]._added) {
            this.decorators[index]._updated = true;
        }
    }

    removeDecorator(store: string) {
        if (!store) {
            throw new Error("unable to remove store-less decorator");
        }

        let existing_stores = map(this.decorators, 'store');
        let index = indexOf(existing_stores, store);

        if (index == -1) {
            throw new Error("unable to remove missing decorator, use add instead (" + store + ")");
        }

        if (this.decorators[index]._added) { // if was just added
            return this.decorators.splice(index, 1);
        }
        this.decorators[index]._removed = true;
    }

    addSearchKey(key, value) {
        let ref = this._collection.prefix + value + '/' + this._id;
        this.search_keys_ref.push({
            _id: this._collection.prefix + this._id + '/sk/' + value,
            key: key,
            ref: ref,
            _added: true
        })
    }

    removeSearchKey(value) {
        let id = this._collection.prefix + this._id + '/sk/' + value;
        let index = findIndex(this.search_keys_ref, { _id: id });
        if (index == -1) {
            throw new Error("missing key");
        }
        if (this.search_keys_ref[index]._added) {
            return this.search_keys_ref.splice(index, 1);
        }
        this.search_keys_ref[index]._deleted = true;
    }

    // save()
    // rollback()


}
