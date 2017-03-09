/**
 * Helper class to capture entity contructor
 */
export interface EntityConstructor<T> {
    new(...args : any[]): T 
}

