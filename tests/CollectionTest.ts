import { EntityField } from '../src/EntityField';
import { Entity } from '../src/Entity';
import { EntityBase } from '../src/EntityBase';
import { Collection } from '../src/Collection';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import * as PouchDB from 'pouchdb';
import * as _ from 'lodash';
import { padStart } from 'lodash';

@suite class CollectionTest {

    static db_name;
    static db;

    static before() {
        CollectionTest.db_name = 'CollectionTest' + Math.random();
        CollectionTest.db = new PouchDB(CollectionTest.db_name);
    }

    static after(done) {
        CollectionTest.db.destroy().then(() => {
            done();
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("insert doc should return entity")
    testInsertDoc(done: Function) {
        let posts = new Posts(CollectionTest.db, Post);
        posts.insert({ title: "New One"}).then((p) => {
            if (p.title != "New One") {
                throw new Error("missing data");
            }
            done();
        }).catch(_.noop);
    }

    @test ("insert doc with invalid field value")
    testInsertDocInvalidField(done: Function) {
        let posts = new Posts(CollectionTest.db, Post);
        posts.insert({ title: 7}).then(_.noop).catch(()=>done());
    }

    @test ("missing mandatory insert doc should return failure")
    testInsertErrorCore(done: Function) {
        let posts = new Posts(CollectionTest.db, Post);
        posts.insert({ missing : "key"}).then(_.noop)
        .catch(() => done());
    }

    @test ("insert doc should return entity")
    testInsertDocCoreOnly(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490560"}).then((p) => {
            if (p.mobile != "6465490560") {
                throw new Error("error getting mobile");
            }
            done();
        }).catch(_.noop);
    }

    @test ("too many fields in mandatory should return failure")
    testInsertErrorToMannyCore(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490560", bla: "Bla"}).then(_.noop).catch(() => done());
    }    

    @test ("invalid fields in buckets results in failure")
    testInvalidFieldsInBuckets(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490560", street_num: 5}).then(_.noop).catch(() => done());
    }    

    @test ("update with invalid field value")
    testUpdateWithInvalidValue(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490561", street : "Orchard St."}).then((u) => {
            return users.update(u, { street_num : 7} );
        }).then(_.noop).catch((m) => done());
    }

    @test ("missing mandatory should return failure")
    testInsertErrorMissingCore(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({  mobile : "6465490560" }).then(_.noop).catch(() => done());
    }   

    @test ("insert doc with buckets should return entity")
    testInsertDocCore(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490560", street : "Orchard St.", street_num : "199"}).then((p) => {
            if (p.street_num != "199") {
                throw new Error("error getting street number");
            }
            done();
        }).catch(_.noop);
    }

    @test ("get by id after inserted doc should return entity")
    testGetEntityById(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490560", street : "Orchard St."}).then((p) => {
            return users.get(p.id);
        }).then((p) => {
            if (!p || !p.street) {
                throw new Error("couldn't find p or the data");
            }
            done();
        }).catch(_.noop);
    }

    @test ("find by key value")
    testFindByKeyVal(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490562", street : "Orchard St."}).then((p) => {
            return users.find('mobile', '0562');
        }).then((ps) => {
            if (!ps || ps.length != 1 || ps[0].street != "Orchard St.") {
                throw new Error("couldn't find p or the data");
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    }    

    @test ("update value basic")
    testUpdateBasic(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490561", street : "Orchard St."}).then((p) => {
            return users.update(p, { street : "23 e 109th"} );
        }).then((p) => {
            return users.get(p.id);
        }).then((p) => {
            if (p.street != "23 e 109th") {
                throw new Error("not updated as expected")
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    }  

    @test ("update missing key / value basic - should raise error")
    testUpdateBasicFailure(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490561", street : "Orchard St."}).then((p) => {
            return users.update(p, { missing_key : "value"} );
        }).then(_.noop).catch(() => done());
    }  

    @test ("remove entity")
    testRemoveEntity(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490561", street : "Orchard St."}).then((p) => {
            return users.remove(p);
        }).then((p) => {
            return users.get(p.id);
        }).then((p) => {
            console.log(p);
        }).catch((m) => {
            done();
        });
    }    

    @test ("test performance + remove") @timeout(10000)
    testPerformanceRemove(done: Function) {
        let users = new Users(CollectionTest.db, User);

        let us = [];
        for (let i=0;i<999;i++) {
            let pad = padStart(i.toString(), 3, "0");
            us.push(users.insert({ name: "user " + pad, mobile : "6465490" + pad, street : "Orchard St.", street_num: pad}));
        }
        Promise.all(us).then((u) => {
            return users.find('mobile', '64654904', { startsWith : true });
        }).then((us) => {
            if (!us || us.length != 100) {
                throw new Error("couldn't find 100 docs");
            }
            var ps = [];
            for (let u of us) {
                ps.push(users.remove(u));
            }
            return Promise.all(ps);
        }).then((us) => {
            return users.find('mobile', '64654904', { startsWith : true });
        }).then((us) => {           
            if (!us || us.length != 0) {
                throw new Error("removed failed");
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    }   

    @test ("test performance + update") @timeout(10000)
    testPerformanceUpdate(done: Function) {
        let users = new Users(CollectionTest.db, User);

        let us = [];
        for (let i=0;i<999;i++) {
            let pad = padStart(i.toString(), 3, "0");
            us.push(users.insert({ name: "user " + pad, mobile : "6465490" + pad, street : "Orchard St.", street_num: pad}));
        }
        Promise.all(us).then((u) => {
            return users.find('mobile', '64654904', { startsWith : true });
        }).then((us) => {
            if (!us || us.length != 100) {
                throw new Error("couldn't find 100 docs");
            }
            var ps = [];
            for (let u of us) {
                ps.push(users.update(u, {street_num : "1"}));
            }
            return Promise.all(ps);
        }).then((us) => {
            return users.find('mobile', '64654904', { startsWith : true });
        }).then((us) => {           
            if (!us || us.length != 100 && us[0].street_num != "1") {
                throw new Error("removed failed");
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    }        
}

/**
 * Posts example
 */
class Post extends Entity {

    @EntityField({
        mandatory: true,
        group: "default",
        name: "title",
        validate: (v) => { return _.isString(v) && v.length < 50}
    })
    title: string;

}

class Posts extends Collection<Post> {
    
    public getPrefix(): string {
        return "posts";
    }

}

/**
 * Users example
 */
class User extends Entity {

    @EntityField({
        mandatory: true,
        group: "default",
        name: "mobile",
        search_by: ["lastFourDigits", _.identity],
        validate : "testString"
    })
    mobile: string;

    @EntityField({
        mandatory: true,
        group: "default",
        name: "name"
    })
    name: string;

    @EntityField({
        mandatory: false,
        group: "address",
        name: "street",
        description: "User's street",
        validate : "testString"       
    })
    street: string;

    @EntityField({
        mandatory: false,
        group: "address",
        name: "street_num",
        description: "street number",
        validate : (v) => { return _.isString(v) && v.length < 50}

    })
    street_num: string;


    protected lastFourDigits(mobile) {
        return mobile.substr(-4);
    }

    protected testString(v) {
        return _.isString(v);
    } 

}

class Users extends Collection<User> {
    
    public getPrefix(): string {
        return "users";
    }

}
