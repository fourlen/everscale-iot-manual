from tonclient.types import ClientConfig, ParamsOfDecodeMessageBody, Abi, ParamsOfQuery, ParamsOfDecodeBoc, AbiParam
from tonclient.client import TonClient, DEVNET_BASE_URLS
from time import sleep
from loguru import logger


client_config = ClientConfig()
client_config.network.endpoints = DEVNET_BASE_URLS
client = TonClient(config=client_config)

# lighthouse_abi = Abi.from_path('/mnt/d/robonomics/freeton-robonomics_contracts/artifacts/Lighthouse.abi.json')


def decode_bytes_string(bytes_string):
  decoded = ''
  for i in range(0, len(bytes_string), 2):
    decoded += chr(int('0x' + bytes_string[i:i + 2], base=16))
  return decoded


def decode_lighthouse_internal_message_body(msg_body):
  return client.abi.decode_message_body(
      ParamsOfDecodeMessageBody(
          abi=lighthouse_abi,
          body=msg_body,
          is_internal=True
      )
  )


def get_demand_cell(decoded_msg_body):
  return client.abi.decode_boc(
    ParamsOfDecodeBoc(
      boc=decoded_msg_body.value['demandCell'],
      allow_partial=True,
      params=[
        AbiParam('terms', 'ref(tuple)', components=[
          AbiParam('model', 'bytes'),
          AbiParam('objective', 'bytes'),
          AbiParam('cost', 'uint128'),
          AbiParam('token', 'address'),
          AbiParam('penalty', 'uint128'),
          AbiParam('validator', 'ref(tuple)', components=[
            AbiParam('contract', 'optional(address)'),
            AbiParam('pubkey', 'optional(uint256)')
          ])
        ]),
        AbiParam('isDemand', 'bool'),
        AbiParam('lighthouse', 'address'),
        AbiParam('customerAddress', 'address'),
        AbiParam('customerPubKey', 'uint256')
      ]
    )
  ).data


def get_lighthouse_transactions():
  return client.net.query(
        params=ParamsOfQuery(
            """
    query {
      blockchain{
      account(address:"0:34f36279f650b703e306e6f5bb200d4f47e7852f34da01667c08e8769e601801"){
        transactions{
          edges{
            node{
              id
              hash
              in_msg
              out_msgs
            }
          }
          pageInfo{
            endCursor
            hasNextPage
          }
        }
      }
      }
    }
    """
        )
    ).result['data']['blockchain']['account']['transactions']['edges']


def get_msg_body(msg_hash):
  return client.net.query(
        ParamsOfQuery("""
    query($msg_hash:String!){
      blockchain{
        message(hash: $msg_hash){
          body
        }
      }
    }
    """,
      variables={
      'msg_hash': msg_hash
    })
    ).result['data']['blockchain']['message']['body']


def main():

  logger.info('Start polling...')
  
  transactions_count = len(get_lighthouse_transactions())

  logger.info(f'Transactions count: {transactions_count}')
  while True:
    res = get_lighthouse_transactions()
    if len(res) == transactions_count:
      sleep(1)
      continue
    
    logger.info('Transaction catched!')

    transactions_count = len(res)
    
    last_transaction = res[-1] #доработать, нужно обработать не только последнюю транзакциюю, т.к. за этот
    #                          промежуток времени могут отправить несколько транзакций



    # in_msg_body = get_msg_body(last_transaction['node']['in_msg'])
    # decoded_msg_body = client.abi.decode_message_body(
    #     ParamsOfDecodeMessageBody(
    #         abi=lighthouse_abi,
    #         body=in_msg_body,
    #         is_internal=True
    #     )
    # )

    # demand = get_demand_cell(decoded_msg_body)
    # demand_objective = decode_bytes_string(demand['terms']['objective'])

    # if demand_objective == 'Turn on/off a bulb':
    #     logger.info('Turn on/off a bulb')

if __name__ == '__main__':
  main()