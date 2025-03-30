import { Request, Response } from "express";
import { placeOrder, getunReceivedOrders, deleteAspecificOrder,Orders } from "../../models/orders/orders";
import { responseError } from "../../../helper";



export const handlePlaceOrder = (request: Request, response: Response): void => {
  placeOrder(request, response);
};

export const handleGetOrders = async (request: Request, response: Response) => {
  try {
    const { status , orderTransactionid } = request.query;
    if (status === "pending") {
      const orders = await getunReceivedOrders(request.query as any);
      response.send({ result: orders, status: "success", statusCode: 200 });
    } else {
      const orders = await new Orders().getOrdersTransactionItems(orderTransactionid as any);
      response.send({ result: { products: orders }, status: "success", statusCode: 200 });
    }
  } catch (err) {
    responseError(response);
  }
};

export const handleDeleteAspecificOrder = async (request: Request, response: Response): Promise<Response> => {
  try {
    const { productordersid } = request.body;
    const isDeleted = await deleteAspecificOrder(productordersid, response);
    return isDeleted
      ? response.send({
          status: "success",
          message: "Order deleted successfully",
          statusCode: 200,
        })
      : response.send({
          status: "success",
          message: "Order delete operation failed",
          statusCode: 200,
        });
  } catch (err) {
    responseError(response);
  }
};

export async function handleTransactionsOrders(request: Request, response: Response) {
  try {
    const result = await new Orders().getorderTransactionSummary(request.query as any, true);
    response.send(result);
  } catch (err) {
    responseError(response);
  }
}