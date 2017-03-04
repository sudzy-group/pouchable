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

    @test ("insert doc should return entity")
    testInsertDoc(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        collection.insert({ a: "b" }).then((d) => {
            if (d.core.a != "b") {
                throw new Error("missing field a");
            }
            return done();
        }).catch(_.noop);
    }

    @test ("decorators without store should fail")
    testDeocratorWithoutType(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        collection.insert({ a: "b" }, [{ c : "c" }], ['a', 'b']).then(_.noop).catch(() => {
            return done();
        });
    }

    @test ("basic insert")
    testInsertBasic1(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        collection.insert({ a: "b" }, [ { store: 'c', c: "c"}], [{ key : 'a', val : 'b' }]).then((d) => {
            return done();
        }).catch(_.noop);
    }

    @test ("basic insert check ref")
    testInsertBasic2(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        collection.insert({ a: "b" }, [ { store: 'c', c: "c"}], [{ key : 'a', val : 'b' }]).then((d) => {
            let ref = "post/b/" + d.core._id.substr(5);
            if (d.search_keys_ref[0].ref != ref) {
                throw new Error("missing ref");
            }
            return TestEntityCollection.db.get(ref);
        }).then((d) => {
            return done();
        }).catch(_.noop);
    }

    @test ("basic insert and get")
    testInsertBasic3(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        collection.insert({ a: "b" }, [ { store: 'c', c: "c"}], [{ key : 'a', val : 'b' }]).then((d) => {
            let id = d.core._id.substr(5);
            return collection.getById(id);
        }).then((d) => {
            if (!d.core._id) {
                throw new Error("missing core doc");
            }
            return done();
        }).catch(_.noop);
    }


}
