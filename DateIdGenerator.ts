/**
 * Id generaotr that returns the current date time as unique id
 */
import { IdGenerator } from './IdGenerator';
import { random, padStart } from 'lodash';

export class DateIdGenerator implements IdGenerator {

    get() {
        return new Date().getTime() + '-' + padStart(random(0, 999).toString(), 3, '0');
    }

}
