import database_queries from "./database/queries";

export default function Role_Handler(request, response) {
  const method = request.method;
  switch (method) {
    case 'GET':
      if (Object.keys(request.query).includes('userid')) {
        let id = parseInt(request.query.userid);
        console.log(id)
        database_queries.getSingleRole(request, response, id)
      }
      else {
        database_queries.getAllRoles(request, response)
      }
      break
    case 'POST':
      const { fullname, username, role, password } = JSON.parse(request.body);
      database_queries.newRole(fullname, username, password, role, request, response)
      break
    case 'PUT':
      database_queries.updateRole(request, response)
      break
    case 'DELETE':
      const { id } = JSON.parse(request.body);
      database_queries.deletewithID(id, request, response)
      break
  }
}