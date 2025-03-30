## Summary
The `WastageInventory` class is a subclass of the `Inventory` class. It provides methods for calculating the quantity of products in stock, updating orders for wastage, checking if wastage debit history exists, and disposing of expired products.

## Example Usage
```javascript
const wastageInventory = new WastageInventory(stockid);
const productordersid = 123;

const quantityInStock = await wastageInventory.calculateProductInstock(productordersid);
console.log(quantityInStock); // Output: the quantity of the product in stock

const state = 1;
await wastageInventory.updateOrdersWastage(productordersid, state);
// The orders for the specified product will be updated with the given state

const isDebitHxExist = await wastageInventory.isWastageDebitHxExist(productordersid);

const records = {
  productordersid: 123,
  brand: "Brand A",
  brandid: 456,
  stockid: 789,
  batchnumber: "Batch 1"
};
const disposalResult = await wastageInventory.disposeoffExpireProduct(records);
console.log(disposalResult); // Output: the number of rows affected if the product was successfully disposed of, null otherwise
```

## Code Analysis
### Main functionalities
- Calculate the quantity of a product in stock by subtracting the total debited quantity from the quantity received.
- Update the orders for a product to mark it as expired or disposed.
- Check if wastage debit history exists for a product.
- Dispose of expired products by adding a wastage debit history and updating the orders.
___
### Methods
- `calculateProductInstock(productordersid)`: Calculates the quantity of a product in stock by subtracting the total debited quantity from the quantity received.
- `updateOrdersWastage(productordersid, state)`: Updates the orders for a product to mark it as expired or disposed.
- `isWastageDebitHxExist(productordersid)`: Checks if wastage debit history exists for a product.
- `disposeoffExpireProduct(records)`: Disposes of expired products by adding a wastage debit history and updating the orders.
___
### Fields
- `stockid`: The ID of the stock associated with the `WastageInventory` instance.
___


## Summary
The `calculateProductInstock` method calculates the amount of a product that is currently in stock and not used.

## Example Usage
```javascript
const inventory = new WastageInventory(stockid);
const productordersid = 123;
const amountInStock = await inventory.calculateProductInstock(productordersid);
console.log(amountInStock);
```
In this example, we create a new instance of the `WastageInventory` class with a `stockid` parameter. We then call the `calculateProductInstock` method with a `productordersid` parameter to calculate the amount of the product that is currently in stock and not used. The result is stored in the `amountInStock` variable and printed to the console.

## Code Analysis
### Inputs
- `productordersid` (number): The ID of the product order for which to calculate the product in stock.
___
### Flow
1. Retrieve the debit history for the given `productordersid` using the `getDebitHxSingle` method.
2. If the debit history is empty, return `false` to indicate that there is no product in stock.
3. Query the database to get the quantity received (`qty`) for the given `productordersid`.
4. Calculate the total debited quantity by summing up the `debitqty` values from the debit history.
5. Subtract the total debited quantity from the quantity received to get the amount of the product that is currently in stock and not used.
6. Return the calculated amount.
___
### Outputs
- The amount of the product that is currently in stock and not used. Returns `false` if there is no product in stock.
___

## Summary
The `updateOrdersWastage` method is responsible for updating the `expiredDisposed` field in the `orders` table based on the provided `productordersid` and `state` values.

## Example Usage
```javascript
const inventory = new WastageInventory();
const productordersid = 123;
const state = 1;
const result = await inventory.updateOrdersWastage(productordersid, state);
console.log(result); // Returns the result of the update query
```

## Code Analysis
### Inputs
- `productordersid` (number): The ID of the product order for which to update the `expiredDisposed` field.
- `state` (number): The value to set for the `expiredDisposed` field.
___
### Flow
1. Construct the SQL query string to update the `expiredDisposed` field in the `orders` table.
2. Execute the query using the `promisifyQuery` function, passing the query string and the `state` and `productordersid` values as parameters.
3. Return the result of the query execution.
___
### Outputs
- The result of the update query execution.
___

## Summary
This method checks if there is any record in the "generalstoredebithx" table where the "wastage" column is set to 1 and the "productordersid" column matches the provided input.

## Example Usage
```javascript
const inventory = new WastageInventory();
const productordersid = 12345;
const result = await inventory.isWastageDebitHxExist(productordersid);
console.log(result); // true or false
```

## Code Analysis
### Inputs
- `productordersid` (number) - The ID of the product order to check for wastage debit history.
___
### Flow
1. Execute a SQL query to select all records from the "generalstoredebithx" table where the "wastage" column is set to 1 and the "productordersid" column matches the provided `productordersid`.
2. Check if the result of the query has a length greater than 0.
3. Return `true` if there are records found, indicating that wastage debit history exists for the given product order. Otherwise, return `false`.
___
### Outputs
- `result` (boolean) - `true` if there is wastage debit history for the given product order, `false` otherwise.
___


## Summary
This method is used to dispose of expired products by updating the database records. It checks if the required keys are present in the input object, and if not, throws an error. It then checks if there is any existing wastage debit history for the given product order. If there is, it returns "EXIST". Otherwise, it calculates the total quantity of the product in stock and not used, and adds a new wastage debit history entry for the product. Finally, it updates the orders table to mark the product as expired and disposed.

## Example Usage
```javascript
const inventory = new WastageInventory();
const records = {
  productordersid: 123,
  brand: "Brand A",
  brandid: 456,
  stockid: 789,
  batchnumber: "ABC123"
};
const result = await inventory.disposeoffExpireProduct(records);
console.log(result);
```
Output:
- If the required keys are not found in the input object, it throws an error.
- If there is an existing wastage debit history for the given product order, it returns "EXIST".
- If the product is successfully disposed of, it returns the number of rows affected in the orders table.
- If there are any errors or the product is not disposed of, it returns null.

## Code Analysis
### Inputs
- `records` (object): An object containing the following properties:
  - `productordersid` (number): The ID of the product order.
  - `brand` (string): The brand of the product.
  - `brandid` (number): The ID of the brand.
  - `stockid` (number): The ID of the stock.
  - `batchnumber` (string): The batch number of the product.
___
### Flow
1. Destructure the `records` object to get the required properties.
2. Check if the `productordersid` property is present in the `records` object. If not, throw an error.
3. Check if there is any existing wastage debit history for the given `productordersid`. If there is, return "EXIST".
4. Calculate the total quantity of the product in stock and not used by calling the `calculateProductInstock` method.
5. Add a new wastage debit history entry for the product by calling the `addDebitHx` method.
6. If the wastage debit history entry is successfully added, update the orders table to mark the product as expired and disposed by calling the `updateOrdersWastage` method.
7. Return the number of rows affected in the orders table.
___
### Outputs
- If the required keys are not found in the input object, it throws an error.
- If there is an existing wastage debit history for the given product order, it returns "EXIST".
- If the product is successfully disposed of, it returns the number of rows affected in the orders table.
- If there are any errors or the product is not disposed of, it returns null.
___
