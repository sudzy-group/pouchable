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
            let ref = "post/b/" + d.core.index;
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
            let id = d.core.index;
            return collection.getById(id);
        }).then((d) => {
            if (!d.core._id) {
                throw new Error("missing core doc");
            }
            return done();
        }).catch(_.noop);
    }

    @test ("missing get should fail")
    testMissingGet(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        collection.getById("missing-id").then(_.noop).catch(() => done());
    }

    @test ("basic insert, remove and get")
    testInsertBasicRemove(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        collection.insert({ a: "b" }, [ { store: 'c', c: "c"}], [{ key : 'a', val : 'b' }]).then((d) => {
            let id = d.core.index;
            return collection.getById(id);
        }).then((e) => {
            if (!e.core._id) {
                throw new Error("missing core doc");
            }
            return collection.remove(e);
        }).then((e) => {
            let id = e.core.index;
            return collection.getById(id);
        }).then(_.noop).catch(() => done())
    }

    @test ("basic insert and find")
    testInsertAndFind(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        collection.insert({ a: "b" }, [ { store: 'c', c: "c"}], [{ key : 'a', val : 'special' }]).then((d) => {
            let id = d.core.index;
            return collection.findByKey('special');
        }).then((d) => {
            if (d.length != 1) {
                throw new Error("couldn't find the right doc")
            }
            return done();
        }).catch(_.noop);
    }

    @test("999 inserts and find") @timeout(4000)
    testInsertPerformance(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        let ps = [];
        for (let i=0;i<999;i++) {
            var s =_.padStart(i.toString(), 3, "0");
            let p = collection.insert({ a: "b" + s }, [ { store: 'c', c: "c" + s}], [{ key : 'a', val : 'special' + s }])
            ps.push(p);
        }
        Promise.all(ps).then((d) => {
            return collection.findByKey('special789');
        }).then((entities) => {

            if (entities.length != 1 || entities[0].core.a != "b789"  ) {
                var error = new Error("entity not found");
                (<any>error).expected = "expected";
                (<any>error).actual = "to fail";
                throw error;
            }
            return done();
        }).catch(_.noop);
    }

    @test("20 inserts and find with start with") @timeout(2000)
    testStartsWith(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        let ps = [];
        for (let i=0;i<20;i++) {
            var s =_.padStart(i.toString(), 2, "0");
            let p = collection.insert({ a: "b" + s }, [ { store: 'c', c: "c" + s}], [{ key : 'a', val : 'testStartsWith' + s }])
            ps.push(p);
        }
        Promise.all(ps).then((d) => {
            return collection.findByKey('testStartsWith1', true);
        }).then((entities) => {
            if (entities.length != 10 || !entities[0].core.a.startsWith('b1') ) {
                var error = new Error("entity not found");
                (<any>error).expected = "expected";
                (<any>error).actual = "to fail";
                throw error;
            }
            return done();
        }).catch(_.noop);
    }

    @test("inserts without find") @timeout(2000)
    testInsertNotFound(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        let ps = [];
        for (let i=1000;i<1999;i++) {
            var s =_.padStart(i.toString(), 3, "0");
            let p = collection.insert({ a: "b" + s }, [ { store: 'c', c: "c" + s}], [{ key : 'a', val : 'special' + s }])
            ps.push(p);
        }
        Promise.all(ps).then((d) => {
            return collection.findByKey('special9999');
        }).then((entities) => {
            if (entities.length == 0) {
                done();
            }
        }).catch(() => done());
    }

    @test("inserts similar") @timeout(2000)
    testSimilarDocs(done: Function) {
        let collection = new EntityCollection("post", TestEntityCollection.db);
        let ps = [];
        for (let i=0;i<100;i++) {
            var s =_.padStart(i.toString(), 3, "0");
            let p = collection.insert({ a: "b" + s }, [ { store: 'c', c: "c" + s}], [{ key : 'a', val : 'testSimilarDocs' + s }])
            ps.push(p);
        }
        for (let i=0;i<100;i++) {
            var s =_.padStart(i.toString(), 3, "0");
            let p = collection.insert({ a: "b" + s }, [ { store: 'c', c: "c" + s}], [{ key : 'a', val : 'testSimilarDocs' + s }])
            ps.push(p);
        }
        Promise.all(ps).then((d) => {
            return collection.findByKey('testSimilarDocs030');
        }).then((entities) => {
            if (entities.length != 2) {
                throw new Error("error in finding similar docs")
            }
            done();
        }).catch(_.noop);
    }
}
