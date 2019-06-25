import GraphQlServer from "../services/GraphQl/index.js";

console.log('injected me');

window.__APOLLO_CLIENT__ = GraphQlServer();
