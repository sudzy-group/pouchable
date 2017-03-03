import * as PouchDB from 'pouchdb';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { EntityCollection } from './EntityCollection';

@suite class TestEntityCollection {

    static db_name : string;
    static db: PouchDB;
    static collection: EntityCollection;

    static before() {
        TestEntityCollection.db_name = 'TestEntityCollection' + Math.random();
        TestEntityCollection.db = new PouchDB(TestEntityCollection.db_name);
        TestEntityCollection.collection = new EntityCollection("post", TestEntityCollection.db);
    }

    static after() {
        TestEntityCollection.db.destroy().then(function (response) {
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("isExists should return a promise")
    testIsExists(done: Function) {
        TestEntityCollection.collection.isExists('120').then(function (d) {
            throw new Error();
        }).catch(function (e) {
            done()
        });

    }

}
