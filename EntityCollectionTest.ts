import * as PouchDB from 'pouchdb';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { EntityCollection } from './EntityCollection';
import * as _ from 'lodash'

@suite class TestEntityCollection {

    static db_name : string;
    static db: PouchDB;

    static before() {
        TestEntityCollection.db_name = 'TestEntityCollection' + Math.random();
        TestEntityCollection.db = new PouchDB(TestEntityCollection.db_name);
    }

    static after(done) {
        TestEntityCollection.db.destroy().then(() => {
            done();
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("insert should return a promise")
    testInsert1(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        collection.insert({ a: "b" }).then((d) => {
            return done();
        }).catch(_.noop);
    }

    @test ("insert should return a promise")
    testDeocratorWithoutType(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        collection.insert({ a: "b" }, [{ c : "c" }], ['a', 'b']).then(_.noop).catch(() => {
            return done();
        });
    }

    @test ("insert should return a promise")
    testInsertBasic(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        collection.insert({ a: "b" }, [ { type: 'ba', c: "c"}], ['a', 'b']).then((d) => {
            return done();
        }).catch(_.noop);
    }


}
