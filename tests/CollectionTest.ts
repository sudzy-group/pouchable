import { EntityField } from '../src/EntityField';
import { Entity } from '../src/Entity';
import { EntityBase } from '../src/EntityBase';
import { Collection } from '../src/Collection';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import * as PouchDB from 'pouchdb';
import * as _ from 'lodash';
import { padStart, startsWith, identity } from 'lodash';
import { Promise } from 'ts-promise';

@suite class CollectionTest {

    static db_name;
    static db;

    before() {
        CollectionTest.db_name = 'CollectionTest' + Math.random();
        CollectionTest.db = new PouchDB(CollectionTest.db_name);
    }

    after(done) {
        CollectionTest.db.destroy().then(() => {
            done();
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("insert doc should return entity")
    testInsertDoc1(done: Function) {
        let posts = new Posts(CollectionTest.db, Post);
        posts.insert({ title: "New One"}).then((p) => {
            if (p.title != "New One") {
                throw new Error("missing data");
            }
            done();
        }).catch(_.noop);
    }

    @test ("insert doc with created_at should return entity")
    testInsertDoc2(done: Function) {
        let posts = new Posts(CollectionTest.db, Post);
        posts.insert({ title: "New Two"}, new Date().getTime()).then((p) => {
            if (p.title != "New Two") {
                throw new Error("missing data");
            }
            done();
        }).catch(_.noop);
    }

    @test ("insert doc with created_at and original id should return entity")
    testInsertDoc2WithId(done: Function) {
        let posts = new Posts(CollectionTest.db, Post);
        const created_at = new Date().getTime()
        const originalId = created_at + '-' + Math.random();
        posts.insert({ title: "New Two"}, created_at, originalId).then((p) => {
            if (p.title != "New Two") {
                throw new Error("missing data");
            }
            if (p.id != originalId) {
                throw new Error("error assignining original id");
            }
            done();
        }).catch(_.noop);
    }    

    @test ("insert doc with created_at in the previous should return entity")
    testInsertDoc3(done: Function) {
        let posts = new Posts(CollectionTest.db, Post);
        let ca = new Date().getTime();
        posts.insert({ title: "New Three"}, ca).then((p) => {
            if (p.title != "New Three") {
                throw new Error("missing data");
            }
            if (p.created_at != ca) {
                throw new Error("created at was not stored correctly");
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

    @test ("update with different field")
    testUpdateWithDifferentValue(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490561"}).then((u) => {
            return users.update(u, { street_num : "7"} );
        }).then((u) => {
            if (u.street_num != "7") {
                throw new Error("Unable to update street num");
            }
            done()
        }).catch((m) => {
            console.log(m)
        });
    }

    @test ("update mandatory field")
    testUpdateMandator(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New Two", mobile : "6465490999"}).then((u) => {
            return users.update(u, { mobile : "6465499991"} );
        }).then(u=> {
            if (u.mobile != "6465499991") {
                throw new Error("Unable to update mobile");
            }
            return users.find('mobile', '9991');
        }).then(us=> {  
            if (!us || us.length == 0 || us[0].mobile != '6465499991') {
                throw new Error("Unable to find by updated mobile");
            }
            return users.find('mobile', '6465490999');
        }).then(us=> {              
            if (us.length != 0) {
                throw new Error("Error finding old key");
            }
            done()
        }).catch((m) => console.log(m));
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

    @test ("get missing key")
    testGetMissingKey(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465499876", street : "Orchard St."}).then((p) => {
            return users.find('mobile', '6465499876');
        }).then((ps) => {
            if (!ps || ps.length != 1 || ps[0].street != "Orchard St.") {
                throw new Error("couldn't find p or the data");
            }
            if (ps[0].another_one != null) {
                throw new Error("couldn't access missing key");
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

    @test ("update value then find by updated key")
    testUpdateThenFetch(done: Function) {
        let keyupdates = new KeyUpdates(CollectionTest.db, KeyUpdate);
        keyupdates.insert({ my_number: 1 }).then((k) => {
            return keyupdates.update(k, { my_number : 2} );
        }).then((p) => {
            return keyupdates.find('my_number', 2);
        }).then((k) => {
            if (!k || k.length != 1) {
                console.log(k);
                throw new Error("key was not updated as expected")
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    }   

    @test ("update value then find by old key should fail")
    testUpdateThenFetchWithPrevious(done: Function) {
        let keyupdates = new KeyUpdates(CollectionTest.db, KeyUpdate);
        keyupdates.insert({ my_number: 1 }).then((k) => {
            return keyupdates.update(k, { my_number : 2} );
        }).then((p) => {
            return keyupdates.find('my_number', 1);
        }).then((k) => {
            if (!k || k.length != 0) {
                throw new Error("old key still present")
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    }      

    @test ("insert zero number search key")
    testInsertZeroSearchKey(done: Function) {
        let keyupdates = new KeyUpdates(CollectionTest.db, KeyUpdate);
        keyupdates.insert({ my_number: 0 }).then((k) => {
            return keyupdates.update(k, { my_number : 1} );
        }).then((p) => {
            return keyupdates.find('my_number', 1);
        }).then((k) => {
            if (!k || k.length != 1) {
                console.log(k);
                throw new Error("key was not updated as expected")
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    }   


    @test ("insert values and serach for any")
    testSearchForAnyValue(done: Function) {
        let keyupdates = new KeyUpdates(CollectionTest.db, KeyUpdate);
        let ps = [];
        _.times(10, (i) => {
            ps.push(keyupdates.insert({ my_number: i }));
        })
        Promise.all(ps).then((k) => {
            return keyupdates.find('my_number', '', { startsWith : true });
        }).then((k) => {
            if (!k || k.length < 9) { // 0 should not be added
                console.log(k);
                throw new Error("key was not updated as expected")
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    } 
    
    @test ("insert values and serach descending")
    testSearchWithDesc(done: Function) {
        let keyupdates = new KeyUpdates(CollectionTest.db, KeyUpdate);
        let ps = [];
        _.times(10, (i) => {
            ps.push(keyupdates.insert({ my_number: i }));
        })
        Promise.all(ps).then((k) => {
            return keyupdates.find('my_number', '', { startsWith : true, descending: true });
        }).then((k) => {
            if (k[0].my_number < k[1].my_number) {
                console.log(k);
                throw new Error("need to be descending");
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    }     

    @test ("insert values and serach for greater than")
    testSearchForGreaterThan(done: Function) {
        let keyupdates = new KeyUpdates(CollectionTest.db, KeyUpdate);
        let ps = [];
        _.times(10, (i) => {
            ps.push(keyupdates.insert({ my_number: i }));
        })
        Promise.all(ps).then((k) => {
            return keyupdates.find('my_number', 5, { gte: true });
        }).then((k) => {
            if (!k || k.length != 5) { // 0 should not be added
                console.log(k.length);
                throw new Error("key was not found as expected")
            }
            return keyupdates.findIds('my_number', 5, { gte: true });
        }).then((k) => {
            if (!k || k.length != 5) { // 0 should not be added
                console.log(k.length);
                throw new Error("key was not found as expected")
            }
            let e = Date.now();
            let s = Date.now() - 7000;
            return keyupdates.findByIds(s, e);
        }).then((ks) => {
            if (!ks || ks.length == 0) { 
                console.log(0);
                throw new Error("range was not found as expected")
            }
            let e = Date.now();
            let s = Date.now() - 7000;
            return keyupdates.findIdsByRange(s, e);
        }).then((ids) => {
            if (!ids || ids.length == 0) { 
                console.log(0);
                throw new Error("range was not found as expected")
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    }

    @test ("insert boolean and search by value 'false'")
    testSearchByBoolean(done: Function) {
        let keyupdates = new KeyUpdates(CollectionTest.db, KeyUpdate);
        let ps = [];
        _.times(5, (i) => {
            let n = _.padStart((100+i).toString(), 4, '0');
            ps.push(keyupdates.insert({ my_number: n , another_number: 100, test_boolean: false }));
        })
        _.times(5, (i) => {
            i = i + 6;
            let n = _.padStart((100+i).toString(), 4, '0');
            ps.push(keyupdates.insert({ my_number: n , another_number: 100, test_boolean: true }));
        })
        Promise.all(ps).then((k) => {
            return keyupdates.find('test_boolean', false);
        }).then((k) => {
            if (!k || k.length != 5) { 
                throw new Error("key was not found by boolean as expected")
            }
            if (!k[0].id || k[0].test_boolean) {
                throw new Error("value and ids should be present")
            }
            // updating is_confirmed to true
            return keyupdates.update(k[0], { test_boolean: true } );
        }).then((k) => {
            return keyupdates.find('test_boolean', false);
        }).then((k) => {
            // now we need only 4 to be found in the database
            if (!k || k.length != 4) { 
                throw new Error("key was not found by boolean as expected")
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    }   

    @test ("insert values and serach for Ids")
    testSearchForIds(done: Function) {
        let keyupdates = new KeyUpdates(CollectionTest.db, KeyUpdate);
        let ps = [];
        _.times(10, (i) => {
            let n = _.padStart((100+i).toString(), 4, '0');
            ps.push(keyupdates.insert({ my_number: n , another_number: 100 }));
        })
        Promise.all(ps).then((k) => {
            return keyupdates.findIds('my_number', '010', { startsWith : true });
        }).then((k) => {
            if (!k || k.length < 9) { // 0 should not be added
                throw new Error("key was not updated as expected")
            }
            if (!k[0].id || !k[0].value) {
                throw new Error("value and ids should be present")
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

    @test ("search key that has undefined value")
    testInsertWithUndefinedSearchValue(done: Function) {
        let keyupdates = new KeyUpdates(CollectionTest.db, KeyUpdate);
        keyupdates.insert({ my_number: 1, another_number: 1 }).then((k) => {
            return keyupdates.find('another_number', 1);
        }).then((ks) => {
            if (!ks || ks.length != 0) {
                console.log(ks);
                throw new Error("search key should have been deleted")
            }
            done();
        }).catch((m) => {
            console.log(m)
        });
    }     

    @test ("search key that has undefined value")
    testSearchKeyWithUndefinedValue(done: Function) {
        let keyupdates = new KeyUpdates(CollectionTest.db, KeyUpdate);
        keyupdates.insert({ my_number: 1, another_number: 5 }).then((k) => {
            return keyupdates.find('another_number', 5);
        }).then((ks) => {
            if (!ks || ks.length != 1) {
                throw new Error("error findKey by another number")
            }
            return keyupdates.update(ks[0], { another_number: 1} );
        }).then((p) => {
            return keyupdates.find('another_number', 1);
        }).then((k) => {
            if (!k || k.length != 0) {
                console.log(k);
                throw new Error("search key should have been deleted")
            }
            done();
        }).catch((m) => {
            console.log(m)
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

    @EntityField({
        mandatory: false,
        group: "temp",
        name: "another_one",
        description: "no_set_ever"
    })
    another_one: string;    

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


/**
 * KeyUpdate example
 */
class KeyUpdate extends Entity {

    @EntityField({
        group: "my_group",
        name: "my_number",
        search_by: [ _.identity ]
    })
    my_number: number;

    @EntityField({
        group: "my_group",
        name: "another_number",
        search_by: [ "positive" ]
    })
    another_number: number;

    @EntityField({
        mandatory: false,
        group: "address",
        name: "test_boolean",
        description: "test boolean",
        search_by: [ identity ]
    })
    test_boolean: boolean;       

    public positive(value) {
        return value == 1 ? undefined : value;
    }
}

class KeyUpdates extends Collection<KeyUpdate> {
    
    public getPrefix(): string {
        return "keys";
    }

}
