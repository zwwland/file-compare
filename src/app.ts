import aligner from "./algorithm.js";

// Start listening on port 8080 of localhost.
const port = Number(Deno.env.get("START_PORT")??8080);
const server = Deno.listen({ port: port });
console.log(`HTTP webserver running.  Access it at:  http://localhost:${port}/`);

// Connections to the server will be yielded up as an async iterable.
for await (const conn of server) {
  // In order to not be blocking, we need to handle each connection individually
  // without awaiting the function
  serveHttp(conn);
}

async function serveHttp(conn: Deno.Conn) {
  // This "upgrades" a network connection into an HTTP connection.
  const httpConn = Deno.serveHttp(conn);
  // Each request sent over the HTTP connection will be yielded as an async
  // iterator from the HTTP connection.
  for await (const requestEvent of httpConn) {
    // The native HTTP server uses the web standard `Request` and `Response`
    // objects.
    if (requestEvent.request.method !== "POST") {
      requestEvent.respondWith(new Response('not allowed', { status: 405 }));
      break
    }
    try {

    const al = aligner.NWaligner({
      gapSymbol: "⭐️"
    });
    const js: {a:string, b:string, sym:string|undefined} = await requestEvent.request.json();
    if(js.sym)
    {
      al.gapSymbol = js.sym;
    }
    const res = al.align(js.a, js.b);
    const body = JSON.stringify(res)  
    // The requestEvent's `.respondWith()` method is how we send the response
    // back to the client.
    requestEvent.respondWith(
      new Response(body, {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        })
      }),
    );
      
    } catch (error) {
      requestEvent.respondWith(new Response(error.message, { status: 500 }));
    }
  }
}
