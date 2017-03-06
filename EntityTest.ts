import * as PouchDB from 'pouchdb';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { EntityCollection } from './EntityCollection';
import { Entity } from './Entity';
import * as _ from 'lodash'

@suite class EntityTest {

    static db_name : string;
    static db: PouchDB;
    static collection: EntityCollection;

    static before() {
        EntityTest.db_name = 'EntityTest' + Math.random();
        EntityTest.db = new PouchDB(EntityTest.db_name);
        EntityTest.collection = new EntityCollection("post", EntityTest.db);
    }

    static after(done) {
        EntityTest.db.destroy().then(() => {
            done();
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("insert doc should return entity")
    testAddDecorator(done: Function) {
        EntityTest.collection.insert({ a: "b" }).then((e) => {
            let o = e.decorators.length;
            e.addDecorator('my-store', { b : "v"});
            if (e.decorators.length != o + 1) {
                throw new Error('addition failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("update decorator")
    testUpdateDecorator1(done: Function) {
        EntityTest.collection.insert({ a: "b" }, [ { store: 'my-store', c: "c" }]).then((e) => {
            let o = e.decorators.length;
            e.updateDecorator('my-store', { b : "v", c: 1});
            if (e.decorators.length != o || e.decorators[0].b != "v" || e.decorators[0].c != 1) {
                throw new Error('update failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("update decorator with nil value")
    testUpdateDecorator2(done: Function) {
        EntityTest.collection.insert({ a: "b" }, [ { store: 'my-store', c: "c", d: "d" }]).then((e) => {
            let o = e.decorators.length;
            // unsetting c and d properties, changing b's value
            e.updateDecorator('my-store', { b : 1, c: null, d: undefined});
            var d = e.decorators[0]
            if (e.decorators.length != o || d.b != 1 || d.c || d.d || !d._updated) {
                throw new Error('update failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("remove decorator")
    testRemoveDecorator(done: Function) {
        EntityTest.collection.insert({ a: "b" }, [ { store: 'my-store', c: "c", d: "d" }]).then((e) => {
            let o = e.decorators.length;
            // unsetting c and d properties, changing b's value
            e.removeDecorator('my-store');
            var d = e.decorators[0]
            if (!d._removed) {
                throw new Error('remove failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("add then remove decorator")
    testAddRemoveDecorator(done: Function) {
        EntityTest.collection.insert({ a: "b" }).then((e) => {
            let o = e.decorators.length;
            e.addDecorator('my-store', { b : "v"});
            e.removeDecorator('my-store');
            if (e.decorators.length != o) {
                throw new Error('remove failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("add search key")
    testAddSearchKey(done: Function) {
        EntityTest.collection.insert({ a: "b" }).then((e) => {
            e.addSearchKey('a', 'b');
            if (e.search_keys_ref.length != 1 || !e.search_keys_ref[0]._added) {
                throw new Error('remove failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("add search key and then remove")
    testAddRemoveSearchKey(done: Function) {
        EntityTest.collection.insert({ a: "b" }).then((e) => {
            e.addSearchKey('a', 'b');
            e.removeSearchKey('b');
            if (e.search_keys_ref.length != 0) {
                throw new Error('remove failed')
            }
            return done();
        }).catch(_.noop);
    }
}
