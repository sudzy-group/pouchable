/**
 * Id generaotr that returns the current date time as unique id
 */
import { IdGenerator } from './IdGenerator';
import { random, padStart } from 'lodash';
import { Promise } from 'ts-promise';

export class DateIdGenerator implements IdGenerator {

    i: number = 0;

    get() {
        this.i = (++this.i) % 99999;
        return new Date().getTime() + '-' + padStart(this.i.toString(), 5, '0');
    }

}
