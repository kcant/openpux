
/*
 * Copyright (C) 2015 Menlo Park Innovation LLC
 *
 * This is licensed software, all rights as to the software
 * is reserved by Menlo Park Innovation LLC.
 *
 * A license included with the distribution provides certain limited
 * rights to a given distribution of the work.
 *
 * This distribution includes a copy of the license agreement and must be
 * provided along with any further distribution or copy thereof.
 *
 * If this license is missing, or you wish to license under different
 * terms please contact:
 *
 * menloparkinnovation.com
 * menloparkinnovation@gmail.com
 */

//
// Module for Amazon AWS simpledb access for IoT applications.
//
// simpledb_module.js
//
// npm install aws-sdk
//

// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SimpleDB.html

var AWS = require('aws-sdk'); 

function SimpleDB_Module(config) {

    this.moduleName = "SimpleDB_Module";
    this.config = config;

    this.trace = false;
    this.traceerrorValue = false;

    if (typeof(config.Trace) != "undefined") {
        this.trace = config.Trace;
    }

    if (typeof(config.TraceError) != "undefined") {
        this.traceerrorValue = config.TraceError;
    }

    // Inherit the logger from config
    this.logger = this.config.logger;

    //
    // Must set the region on the AWS global object
    // {region: 'us-west-1'} is Northern California
    //
    AWS.config.update({region: config.region});

    // Create SimpleDB instance
    this.simpledb = new AWS.SimpleDB();
}

//
// The following functions provides standard Create-Read-Update-Delete
// (CRUD) functions for a standard record/object format useful for
// many applications.
//
// It provides a little bit of structure over the raw collection of
// items and attributes exposed by SimpleDB.
//
// Schema:
//
// Each "object" contains the following items. The rest of the public
// properties on each object are up to the application, but within
// the restrictions imposed by SimpleDB.
//
// All properties, including the following structural ones are
// restricted to the set accepted by SimpleDB. These are:
//
// - Must be a string
// - Certain special characeters are restricted
// - There are limits on maxium lengths
// - Attributes used as search keys use ascii collating sequences and order.
//
// An object presented for storage and retrieval has the following
// properties:
//
//  itemName - "unique_in_entire_domain"
//
//       This must be unique in the entire domain. Its similar to the
//       unique ID generated by a database system. This is the fast
//       retrieval key for getItem().
//

//
// Crud - Create
//
// Create record/object in the database.
//
// itemName - Unique Name.
//
// itemsArray - Array of attributes for object
//
// Note: itemName must be unique or create will fail.
//
// Returns:
//
// Failure:
//
//  error result in callback
//
// Success:
//
//  error == null in callback.
//
// callback(error, result)
//
SimpleDB_Module.prototype.createItem = function(domain, itemName, itemsArray, callback) {

    var self = this;

    //
    // Note: We do not filter or validate SimpleDB rules here for
    // the rest of the public properties on the application object.
    //
    // The SimpleDB request will fail in this case.
    //

    //
    // Create SimpleDB parameters object from appobject data
    //
    var params = self.formatCreateParams(domain, itemName, itemsArray);

    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SimpleDB.html#putAttributes-property
    // http://docs.aws.amazon.com/AmazonSimpleDB/latest/DeveloperGuide/SDB_API_PutAttributes.html

    // Invoke putAttributes web call
    self.simpledb.putAttributes(params, function(error, result) {

        if (error != null) {
            if (error.code == "ConditionalCheckFailed") {
                // This indicates an existing ItemName already
                callback("ItemAlreadyExists", error);
            }
            else {
                callback(error, result);
            }
        }
        else {
            callback(error, itemsArray);
        }
    });
}

//
// cRud - Read
//
// Worker function for SimpleDB getAttributes
//
// Arguments:
//
//   itemName - Name of the item to get.Array of attributes for object
//
//   callback - callback function
//
// Returns:
//
//   On error: callback(error, result)
//
//   On success: callback(null, itemsArray);
//
SimpleDB_Module.prototype.readItem = function(domain, itemName, consistentRead, callback) {

    var self = this;

    var params = new Object();

    params.DomainName = domain;
    params.ItemName = itemName;
    params.ConsistentRead = consistentRead;

    // Without any attribute names, all attributes are returned
    //params.AttributeNames = [
    //  'STRING_VALUE',
    //  /* more items */
    //];

    self.simpledb.getAttributes(params, function(error, data) {

        if (error != null) {
            callback(error, data);
            return;
        }

        // Create the object from the result set.
        var itemsArray = self.getObjectFromGetAttributes(data);
        if (itemsArray == null) {

            //
            // No entry for ItemName because the response record
            // had no attributes.
            //
            callback("ItemDoesNotExist", null);
            return;
        }

        callback(null, itemsArray);
    });
}

//
// crUd - Update, add/update properties
//
// itemName - Unique Name, required.
//
// itemsArray - ItemName and properties to update
//
// Adds new properties from appobject to the itemName.
//
// callback - callback function
//
// It updates/overwrites any properties that already exist on the object.
//
// No properties are deleted from the ItemName, as appobject only
// contains the properties it is desired to update.
//
// Returns:
//
//   On error: callback(error, result)
//
//   On success: callback(null, itemsArray);
//
SimpleDB_Module.prototype.updateItem = function(domain, itemName, itemsArray, callback) {

    var self = this;

    var params = self.formatUpdateParams(domain, itemName, itemsArray);

    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SimpleDB.html#putAttributes-property
    // http://docs.aws.amazon.com/AmazonSimpleDB/latest/DeveloperGuide/SDB_API_PutAttributes.html
    self.simpledb.putAttributes(params, function(error, resutl) {

        if (error != null) {

            //self.tracelog("**** error updating ItemName " + itemName);
            //self.dumpasjson(error);

            if (error.code == "ConditionalCheckFailed") {
                // This indicates existing sensor settings
                callback("ItemAlreadyExists", error);
            }
            else {
                callback(error, result);
            }
        }
        else {
            //self.tracelog("****updateItem success ItemName=" + itemName);
            callback(error, itemsArray);
        }
    });
}

//
// cruD - Delete properties
//
// itemName - Unique Name, required.
//
// Deletes the specified properties from appobject.
//
// callback(error, data);
//
SimpleDB_Module.prototype.deleteProperties = function(domain, itemName, appobject, callback) {

    var params = this.formatDeletePropertiesParams(domain, itemName, appobject);

// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SimpleDB.html#deleteAttributes-property
    this.simpledb.deleteAttributes(params, callback);
}

//
// cruD - Delete
//
// Worker function for SimpleDB deleteItem
//
// Arguments:
//
//   itemName - Name of the item to delete
//
//   callback - callback function
//
// Returns:
//
//   On error: callback(error, result)
//
//   On success: callback(null, null);
//
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SimpleDB.html#deleteAttributes-property
//
SimpleDB_Module.prototype.deleteItem = function(domain, itemName, callback) {

    var self = this;

    var params = new Object();
    params.DomainName = domain;
    params.ItemName = itemName;

    //
    // There is no deleteItem request.
    //
    // The documentation says if no attributes are specified to a
    // deleteAttributes request all attributes are deleted. This results
    // in deletion of the object since an object with no attributes is deleted.
    //
    // The way to not specify is have no property entry name
    // at all for Attributes and Expected. If you provide a name as
    // null, empty string, empty array, etc. it will fail with invalid
    // parameter errors.
    //
    // params.Attributes
    // params.Expected
    //

    this.simpledb.deleteAttributes(params, function(error, data) {

        if (error != null) {
            callback(error, data);
            return;
        }

        // Ensure we are processing result codes properly
        //self.tracelog("**** deleteItemWorker Success: ItemName " + itemName);

        callback(null, null);
    });
}

//
// callback(error, data);
//
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SimpleDB.html#createDomain-property
//
SimpleDB_Module.prototype.createDomain = function(domain, callback) {

    var params = new Object();
    params.DomainName = domain;

    this.simpledb.createDomain(params, callback);
}

//
// callback(error, data);
//
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SimpleDB.html#deleteDomain-property
//
SimpleDB_Module.prototype.deleteDomain = function(domain, callback) {

    var params = new Object();
    params.DomainName = domain;

    this.simpledb.deleteDomain(params, callback);
}

//
// callback(error, data);
//
SimpleDB_Module.prototype.listDomains = function(maxDomains, nextToken, callback) {
    
    var params = new Object();
    params.MaxNumberOfDomains = maxDomains;
    params.NextToken = nextToken;

    this.simpledb.listDomains(params, callback);
}

//
// callback(error, data);
//
SimpleDB_Module.prototype.domainInfo = function(domainName, callback) {

    var params = new Object();
    params.DomainName = domainName;

    this.simpledb.domainMetadata(params, callback);
}

//
// cRud - Read (Query)
//
// Worker function for SimpleDB query.
//
// Arguments:
//
//    queryString - SQL query string accepted by AWS SimpleDB query.
//
//    consistentRead - true or false
//
//    callback - callback function
//
// Returns:
//
//   On error: callback(error, result)
//
//   On success: callback(null, objectsArray);
//
//     On success an array of objects is returned, even if there
//     is only one object in the result set.
//
//     null means no objects matched the queue.
//
// objectsArray = [
//   {itemName: item.Name, item: object},
//   {itemName: item.Name, item: object},
//           ..
// ]
//
SimpleDB_Module.prototype.queryItems = function(expression, consistentRead, nextToken, callback) {

    var self = this;

    var params = new Object();

    params.SelectExpression = expression;
    params.ConsistentRead = consistentRead;
    params.NextToken = nextToken;

    this.simpledb.select(params, function(error, data) {

        if (error != null) {
            callback(error, data);
            return;
        }

        //
        // Get an array of name/value objects describing each item
        // in the result set.
        //
        var objectsArray = self.getObjectNameValueArrayFromResultSet(data);

        //
        // objectsArray can be null if no entries returned for queryString
        //
        callback(null, objectsArray);
    });
}

//
// Worker Functions
//

SimpleDB_Module.prototype.dumpAppObject = function(obj) {

    // Enumerate public properties

    var keys = Object.keys(obj);

    for (var i = 0; i < keys.length; i++) {
        this.logger.log("debug", "keys[" + i + "]=" + keys[i] + " obj[keys[i]]=" + obj[keys[i]]);
    }
}

//
// This formats the SimpleDB parameters for a putAttributes
// operation which creates a new entry.
//
// input:
//
//   domain - SimpleDB domain (table) to create the item into
//
//   itemName - unique name for object
//
//   appobject - Object whose public properties represent the attributes
//    to be placed into SimpleDB as an entry. The names and data format
//    (string) must be compatible with SimpleDB's schema rules.
//
//    No validation is done by this method.
//
// returns:
//
//   object formatted for a request to SimpleDB.putAttributes
//
//
SimpleDB_Module.prototype.formatCreateParams = function(domain, itemName, appobject) {

    //
    // Format Params from appobject
    //

    var params2 = new Object();

    // DomainName is the table name
    params2.DomainName = domain;

    //
    // ItemName must be unique, or putItem will fail.
    //
    params2.ItemName = itemName;

    //
    // http://docs.aws.amazon.com/AmazonSimpleDB/latest/DeveloperGuide/SDB_API_PutAttributes.html
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SimpleDB.html#putAttributes-property
    //
    // Construct the Expected clause
    //
    // What we want is the following:
    //
    // If the entry does not exist, create it.
    //
    // If the entry does exist, fail. Update operations should be performed.
    //
    // We do not want the following:
    //
    // 1) Duplicate items of the same name
    //
    // 2) Overwriting of the older entry with the new data on a name collision
    //
    // These can occur depending on configuration of the Expect block.
    //

    expected = new Object();

    //
    // We use the PrimaryKey to ensure no duplicates exist
    //
    expected.Exists = false;
    expected.Name = "__ItemName";
    //expected.Value = "";

    params2.Expected = expected;

    // Construct the attributes array
    var attributes = new Array();

    var attr = null;
    var attrIndex = 0;

    // get objects public properties
    var keys = Object.keys(appobject);

    var propName = null;
    var propValue = null;

    // Create entries
    for (var i = 0; i < keys.length; i++) {

        //
        // Note: This also creates an attribute entry for ID
        // which is the ItemName as well.
        //
        //this.logger.log("debug", "create: keys[" + i + "]=" + keys[i] + " appobj[keys[i]]=" + appobject[keys[i]]);

        //
        // All attribute names and data must be UTF8 strings, but we don't
        // validate this here.
        //
        attr = new Object();
        attr.Name = keys[i];
        attr.Value = appobject[keys[i]];
        attr.Replace = true;
        attributes[attrIndex++] = attr;
    }

    params2.Attributes = attributes;

    return params2;
}

SimpleDB_Module.prototype.formatUpdateParams = function(domain, itemName, appobject) {

    //
    // Format Params from appobject
    //

    var params2 = new Object();

    // DomainName is the table name
    params2.DomainName = domain;

    //
    // ItemName must be unique, or putItem will fail.
    //
    params2.ItemName = itemName;

    // Construct the attributes array
    var attributes = new Array();

    var attr = null;
    var attrIndex = 0;

    // get objects public properties
    var keys = Object.keys(appobject);

    var propName = null;
    var propValue = null;

    // Create entries
    for (var i = 0; i < keys.length; i++) {

        //
        // All attribute names and data must be UTF8 strings, but we don't
        // validate this here.
        //
        attr = new Object();
        attr.Name = keys[i];
        attr.Value = appobject[keys[i]];
        attr.Replace = true;

        attributes[attrIndex++] = attr;
    }

    params2.Attributes = attributes;

    return params2;
}

SimpleDB_Module.prototype.formatDeletePropertiesParams = function(domain, itemName, appobject) {

    //
    // Format Params from appobject
    //

    var params2 = new Object();

    // DomainName is the table name
    params2.DomainName = domain;

    //
    // ItemName must be unique, or putItem will fail.
    //
    params2.ItemName = itemName;

    // Construct the attributes array
    var attributes = new Array();

    var attr = null;
    var attrIndex = 0;

    // get objects public properties
    var keys = Object.keys(appobject);

    var propName = null;
    var propValue = null;

    // Create entries
    for (var i = 0; i < keys.length; i++) {

        //
        // All attribute names and data must be UTF8 strings, but we don't
        // validate this here.
        //
        attr = new Object();
        attr.Name = keys[i];

        // Just names are required for delete.
        //attr.Value = appobject[keys[i]];
        //attr.Replace = true;

        attributes[attrIndex++] = attr;
    }

    params2.Attributes = attributes;

    return params2;
}

//
// Return Items[] from result set
//
// Return Value:
//
//  null - empty result set
//
SimpleDB_Module.prototype.getItemsFromResultSet = function(data) {

    if (data == null) {
        return null;
    }

    var items = data.Items;
    if (items == null) {
        return null;
    }

    // should not happen
    if (items.length == 0) throw "items.length == 0";

    return items;
}

//
// Get a single expected item from a result set.
//
// Return Value:
//
//  null - no item in result set.
//
//  throws on multiple items, since its an application schema issue.
//
SimpleDB_Module.prototype.getSingleItemFromResultSet = function(data) {

    if (data == null) {
        return null;
    }

    var items = data.Items;
    if (items == null) {
        return null;
    }

    // should not happen, problems with schema or caller
    if (items.length != 1) throw "items.length != 1";

    return items[0];
}

//
// Get object from result set.
//
// Expects only a single item, or no items.
//
// If multiple items it throws an error since its
// a caller/schema error.
//
// Arguments:
//
// data - result set from operation.
//
// Returns: 
//
// null - no item in result set.
//
// object - item mapped to object. See objectFromItemEntry for schema mapping.
//
SimpleDB_Module.prototype.getObjectFromResultSet = function(data) {

    if (data == null) {
        this.tracelog("getObjectFromResultSet: data == null");
        return null;
    }

    var items = data.Items;
    if (items == null) {
        this.tracelog("getObjectFromResultSet: data.Items == null");
        return null;
    }

    // items.length == 0 should not happen
    if (items.length != 1) throw "multiple items returned in result set";

     var obj = this.objectFromItemEntry(items[0]);
     return obj;
}

//
// Get one or more objects form a result set.
//
// Arguments:
//
// data - result set from operation.
//
// Returns: 
//
// null - no items in result set.
//
// object -  Name/Value object:
//
//   {itemName: item.Name, item: object}
//
//   object - item mapped to object. See objectFromItemEntry for schema mapping.
//
// Array[] of Name/Value objects - Array of objects with a name/value entry
// for each object.
//
// result = [
//   {itemName: item.Name, item: object},
//           ..
// ]
//
SimpleDB_Module.prototype.getObjectNameValueArrayFromResultSet = function(data) {

    if (data == null) {
        return null;
    }

    var items = data.Items;
    if (items == null) {
        return null;
    }

    // items.length == 0 should not happen
    if (items.length == 0) throw "items.length == 0";

    var objectArray = new Array();

    for (var index = 0; index < items.length; index++) {
        var obj = this.objectFromItemEntry(items[index]);
        objectArray.push(obj);
    }

     return objectArray;
}

//
// Object Mapping:
//
// Item record with Name and Attributes array to name/value object
// with name and object representing properties.
//
// Arguments:
//
//   item - data.Items[x] entry from result set
//
// Returns:
//
//   null - No data or attributes
//
//   Name/Value object:
//
//   {itemName: item.Name, item: object}
//
//   object mapped with:
//
//   object[item.Attributes[x].Name] = item.Attributes[x].Value
//
//   Typical result set looks like this in JSON:
//
//        { 
//           ResponseMetadata: { 
//             RequestId: '6d0b837b-9ebc-6343-ca56-2a15c075ee60',
//             BoxUsage: '0.0000228616'
//           },
//
//          Items:
//          [ 
//              { 
//               Name: 'Account_1.Sensor_1',
//
//               Attributes: 
//                [ 
//                  { Name: 'SleepTime', Value: '30' },
//
//                  { Name: 'TargetMask3', Value: '0003' },
//
//                  { Name: 'TargetMask2', Value: '0002' },
//
//                  { Name: 'TargetMask1', Value: '0001' },
//
//                  { Name: 'TargetMask0', Value: '0' },
//
//                  [length]: 6 
//                ]
//             },
//             [length]: 1 
//           ]
//        }
//
SimpleDB_Module.prototype.objectFromItemEntry = function(item) {

    if (item == null) return null;
    if (item.Name == null) return null;
    if (item.Attributes == null) return null;
    if (item.Attributes.length == 0) return null;

    var obj = this.objectFromAttributes(item.Attributes);

    // Return the name of the item with the data
    var nv = { itemName: item.Name, item: obj };
    return nv;
}

//
// Object Mapping:
//
// Array of attribute records to object properties
//
SimpleDB_Module.prototype.objectFromAttributes = function(attributes) {

    if (attributes.length == 0) return null;

    var obj = new Object();

    for (var index = 0; index < attributes.length; index++) {
        attr = attributes[index];
        obj[attr.Name] = attr.Value;
    }

    return obj;
}

SimpleDB_Module.prototype.getObjectFromGetAttributes = function(data) {

    if (data == null) return null;
    if (data.Attributes == null) return null;
    if (data.Attributes.length == 0) return null;

    var obj = this.objectFromAttributes(data.Attributes);
    return obj;
}

SimpleDB_Module.prototype.setTrace = function(value) {
    this.trace = value;
}

SimpleDB_Module.prototype.setTraceError = function(value) {
    this.traceerrorValue = value;
}

SimpleDB_Module.prototype.tracelog = function(message) {
    if (this.trace) {
        this.logger.info(this.moduleName + ": " + message);
    }
}

SimpleDB_Module.prototype.traceerror = function(message) {
    if (this.traceerrorValue) {
        this.logger.error(this.moduleName + ": " + message);
    }
}

var util = require('util');

SimpleDB_Module.prototype.dumpasjson = function(ob) {

      //
      // Dump data as JSON
      // null is full depth, default is 2
      // var inspectOptions = { showHidden: true, depth: null };
      //
      var inspectOptions = { showHidden: true, depth: null,
                       customInspect: false, colors: true };

      var dumpdata = util.inspect(ob, inspectOptions);

      this.logger.info(dumpdata);
}

module.exports = {
  SimpleDB: SimpleDB_Module
};
