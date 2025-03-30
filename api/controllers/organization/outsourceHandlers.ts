import { Response, Request } from "express";
import { customError, responseError } from '../../../helper';
import Outsourcing from "../../models/organization/outsourcingOrganization/outsourcing";

export const createOrganizationOutSource = async function (request: Request, response: Response) {
    try {
        const { contactNumber, name } = request.body
        if (!contactNumber || !name || isNaN(contactNumber)) {
            return customError('Invalid request provided', 400, response);
        }
        const isCreated = await new Outsourcing(name, contactNumber).createOutSourceOrganization(request.body);
        response.send({ status: isCreated });
    } catch (err) {
        responseError(response);
    }
}

export const updateOrganizationOutSource = async function (request: Request, response: Response) {
    try {
        const { outsourceid } = request.body
        if (!outsourceid) {
            return customError('Invalid outsourceid request provided', 400, response);
        }
        const isUpdated = await new Outsourcing(null, null).updateOutsourceOrganization(request.body);
        response.send({ status: isUpdated });
    } catch (err) {
        responseError(response);
    }
}


export const updateOrganizationOutSourceServices = async function (request: Request, response: Response) {
    try {
        const { outsourceid } = request.body
        if (!outsourceid) {
            return customError('Invalid outsourceid request provided', 400, response);
        }
        const isUpdated = await new Outsourcing(null, null).loadoutsourceOrganizationServices(request.body);
        response.send({ status: isUpdated });
    } catch (err) {
        responseError(response);
    }
}


export const getOrganizationOutSourceServices = async function (request: Request, response: Response) {
    try {
        const { outsourceid } = request.query;
        if (!outsourceid) {
            return customError('Invalid outsourceid request provided', 400, response);
        }
        const data = await new Outsourcing(null, null).getOrganizationOursourcePricing(parseInt(outsourceid.toString()));
        response.send(data);
    } catch (err) {
        responseError(response);
    }

}


export const getOrganizationOutSourceBasic = async function (request: Request, response: Response) {
    try {
        const { outsourceid } = request.query;
        if (!outsourceid) {
            return customError('Invalid outsourceid request provided', 400, response);
        }
        const data = await new Outsourcing(null, null).getOrganizationBasicInformation(parseInt(outsourceid.toString()));
        response.send(data);
    } catch (err) {
        responseError(response);
    }

}


export const getOrganizationOutsourcingAll = async function (request: Request, response: Response) {
    try {
        const data = await new Outsourcing(null, null).getAllOutsourcingOrganization(request.query as any);
        response.send(data);
    } catch (err) {
        responseError(response);
    }

}




