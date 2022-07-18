const { ApolloServer, gql } = require('apollo-server');
const { response } = require('express');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const Web3 = require('web3');

require('dotenv').config();
const baseURL = process.env.KX_ENDPOINT;
const infura_ws_endpoint = process.env.INFURA_WS_ENDPOINT;
const infura_rest_endpoint = process.env.INFURA_REST_ENDPOINT;
const web3 = new Web3(new Web3.providers.WebsocketProvider(infura_ws_endpoint));

const typeDefs = require('./schema');

function getFilters(info) {
    var response = []
    user_functions = info.operation.selectionSet.selections
        for (let i = 0; i < user_functions.length; i++){
            if (user_functions[i].name.value===info.fieldName) {
                for (let j = 0; j < user_functions[i].selectionSet.selections.length; j++){
                    response.push(user_functions[i].selectionSet.selections[j].name.value)
                }                
            }
        }
    return response.join([seperator = ','])
  }

function getArgumentsAndBuildQuery(args) {
    const mapping = { startTime: 'sd', endTime: 'ed', symbols: 'ids', exchange: 'exc' }
    wClause = ''
    for (const element in args) {
        if (args[element] != null) {
            wClause = wClause.concat(mapping[element])
            wClause = wClause.concat('=')
            if (Array.isArray(args[element])) {
                wClause = wClause.concat(args[element].join([separator = ',']))
            } else {
                wClause = wClause.concat(args[element])
            }
            wClause = wClause.concat('&')    
        }
    }
    wClause = wClause.slice(0, -1)
    return wClause
}

const resolvers = {
    Query: {
      trade: (_, args, context, info) => {
        filters = getFilters(info)
        wClause = getArgumentsAndBuildQuery(args)
        if (!wClause.length) {
            filters = 'columns='.concat(filters)
        } else {
            filters = '&columns='.concat(filters)
        }
        console.log(`${baseURL}/getData?${wClause}${filters}`)
        return fetch(`${baseURL}/getData?${wClause}${filters}`).then(res => res.json())
      },
      order: (_, args, context, info) => {
        filters = getFilters(info)
        wClause = getArgumentsAndBuildQuery(args)
        if (!wClause.length) {
            filters = 'columns='.concat(filters)
        } else {
            filters = '&columns='.concat(filters)
        }
        console.log(`${baseURL}/getData?tbl=order&${wClause}${filters}`)
        return fetch(`${baseURL}/getData?${wClause}${filters}`).then(res => res.json())
      },
      ethereum: (_, args, context, info) => {
        return 0;
      }
    },
    Ethereum: {
      account: (_, args, context, info) => {
        res = {}
        res.address = args.address
        res.balance = web3.eth.getBalance(args.address)
        return res
      },
      transaction: (_, args, context, info) => {
        return web3.eth.getTransaction(args.hash)
      },
      block: (_, args, context, info) => {
        if (args.hash) {
            return web3.eth.getBlock(args.hash, returnTransactionObjects = true)
        } else {
            return web3.eth.getBlock(args.number, returnTransactionObjects = true)
        }
      }
    },
    Block: {
      transactions: (block, args, context, info) => {
        return block.transactions
      }
    }
  }

const server = new ApolloServer({ typeDefs, resolvers, cache: "bounded", introspection: true });

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});