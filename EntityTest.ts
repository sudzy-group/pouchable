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
            if (!d._deleted) {
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

    @test ("save no op")
    testSaveNoOperation(done: Function) {
        EntityTest.collection.insert({ a: "b" }, undefined, [{ key: 'number', val: 'testSaveNoOperation' }]).then((e) => {
            return e.save();
        }).then((e) => {
            return EntityTest.collection.findByKey('testSaveNoOperation');
        }).then((es) => {
            if (es.length != 1 || es[0].decorators.length != 0) {
                throw new Error("entity was not decorated")
            }
            return done();
        }).catch(_.noop);
    }

    @test ("insert doc should return entity")
    testAddDecoratorAndSave(done: Function) {
        EntityTest.collection.insert({ a: "b" }, undefined, [{ key: 'number', val: 'testAddDecoratorAndSave' }]).then((e) => {
            e.addDecorator('my-store', { b : "v"});
            return e.save();
        }).then((e) => {
            return EntityTest.collection.findByKey('testAddDecoratorAndSave');
        }).then((es) => {
            if (es.length != 1 || es[0].decorators.length != 1) {
                throw new Error("entity was not decorated")
            }
            return done();
        }).catch(_.noop);
    }

    @test ("update and save")
    testUpdateAndSave(done: Function) {
        EntityTest.collection.insert({ a: "b" }, [ {store: 'my-store', email : "roy@sudzy.co"} ],
        [{ key: 'number', val: 'testUpdateAndSave' }]).then((e) => {
            e.updateDecorator('my-store', {email : "hbarr@sudzy.co", mobile: "6465490000"});
            return e.save();
        }).then((e) => {
            return EntityTest.collection.findByKey('testUpdateAndSave');
        }).then((es) => {
            if (es.length != 1 || es[0].decorators.length != 1 || !es[0].decorators[0].mobile) {
                throw new Error("entity was not updated")
            }
            return done();
        }).catch(_.noop);
    }

    @test ("remove decorator and save")
    testRemoveDecoratorAndSave(done: Function) {
        EntityTest.collection.insert({ a: "b" }, [ {store: 'my-store', email : "roy@sudzy.co"} ],
        [{ key: 'number', val: 'testRemoveDecoratorAndSave' }]).then((e) => {
            e.removeDecorator('my-store')
            return e.save();
        }).then((e) => {
            return EntityTest.collection.findByKey('testRemoveDecoratorAndSave');
        }).then((es) => {
            if (es.length != 1 || es[0].decorators.length != 0) {
                throw new Error("entity was not updated")
            }
            return done();
        }).catch(_.noop);
    }

    @test ("add search key and find")
    testAddSearchKeyAndSave(done: Function) {
        EntityTest.collection.insert({ a: "b" }, undefined,
        [{ key: 'number', val: 'testAddSearchKey' }]).then((e) => {
            e.addSearchKey('a', 'testAddSearchKey123')
            return e.save();
        }).then((e) => {
            return EntityTest.collection.findByKey('testAddSearchKey123');
        }).then((es) => {
            if (es.length != 1) {
                throw new Error("entity was not updated")
            }
            return done();
        }).catch(_.noop);
    }

    @test ("remove search key and find")
    testRemoveSearchKeyAndSave(done: Function) {
        EntityTest.collection.insert({ a: "b" }, undefined,
        [{ key: 'number', val: 'testRemoveSearchKeyAndSave' }]).then((e) => {
            e.removeSearchKey('testRemoveSearchKeyAndSave')
            return e.save();
        }).then((e) => {
            if (e.search_keys_ref.legnth > 0) {
                throw new Error("Error removing search key");
            }
            return EntityTest.collection.findByKey('testRemoveSearchKeyAndSave');
        }).then((es) => {
            if (es.length != 0)  {
                throw new Error("search key was not removed")
            }
            return done();
        }).catch(_.noop);
    }    

}
