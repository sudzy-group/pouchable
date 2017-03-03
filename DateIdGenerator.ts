/**
 * Id generaotr that returns the current date time as unique id
 */

import { IdGenerator } from './IdGenerator';

export class DateIdGenerator implements IdGenerator {

    get() {
        return new Date().getTime();
    }

}
