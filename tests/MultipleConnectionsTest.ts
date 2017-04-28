import { Entity } from '../src';
import { suite, test, timeout } from "mocha-typescript";
import * as PouchDB from "pouchdb";
import * as _ from 'lodash';
import { EntityField } from '../src/EntityField';
import { EntityBase } from '../src/EntityBase';
import { Collection } from '../src/Collection';

@suite("MultipleConnections test")
class MultipleConnectionsTest {

  @test("should return correct prefix")
  public testMultiple(done) {
    let db = new PouchDB("default_multiple");
    let customerObj = {
      mobile: "19292770101",
      name: "Roy Ganor",
    }
    const customers = new Users(db, User);
    customers.insert(customerObj).then((c) => {
      return customers.find('mobile','19292770101');
    }).then(cs => {
      let c = cs[0];
      let updatedCustomerObj = {
        name: "Roy Ganor1",
      }
      return customers.update(c, updatedCustomerObj);
    }).then((cus) => {
      let db1 = new PouchDB("default_multiple");
      const customers = new Users(db1, User);
      return customers.find('mobile','19292770101');
    }).then((cs) => {
      let c = cs[0];
      console.log(c);
      let updatedCustomerObj = {
        name: "Roy Ganor1",
      }
      return customers.update(c, updatedCustomerObj);
    }).then((c) => {
      let db2 = new PouchDB("default_multiple");
      db2.destroy(() => done());
    }).catch((m) => {
    });
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
        group: "name",
        name: "name",
        search_by: ["firstFive"]
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

    protected firstFive(v) {
        return v.substr(0,5);
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
