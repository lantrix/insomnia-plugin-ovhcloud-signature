const crypto = require('crypto')
const lodash = require('lodash')

module.exports.templateTags = [
  {
    name: 'ovhsignature',
    displayName: 'OVH Signature',
    description: 'Sign OVH CLoud API requests',

    args: [
      {
        displayName: 'Application Secret Key',
        type: 'string',
      },
      {
        displayName: 'Consumer Key',
        type: 'string',
      },
    ],

    async run(context, as, ck, headers) {

      if (!as) throw new Error('missing Application Secret Key')
      if (!ck) throw new Error('missing Consumer Key')

    await Promise.all([
        context.store.setItem("ovhcloud-as", as),
        context.store.setItem("ovhcloud-ck", ck),
      ])

      return
    },
  },
]

function signOvhRequest(as, ck, httpMethod, url, body, timestamp) {
    let signed = [ as, ck, httpMethod, url, '', timestamp ];
    return '$1$' + crypto.createHash('sha1').update(signed.join('+')).digest('hex');
}

module.exports.requestHooks = [async (context) => {
  console.log("Inserting X-Ovh-Signature into http headers")
  const as = await context.store.getItem("ovhcloud-as")
  console.log("as " + as)
  const ck = await context.store.getItem("ovhcloud-ck")
  console.log("ck " + ck)
  const requestUrl = context.request.getUrl();
  console.log("requestUrl " + requestUrl)
  const body = context.request.getBody();
  let requestBody;
  if(lodash.isEmpty(body)) {
   requestBody = ""
  } else {
    requestBody = body
  }
  console.log("requestBody " + requestBody);
  const httpMethod = context.request.getMethod().toUpperCase();
  console.log("httpMethod " + httpMethod)
  const timestamp = Math.round(Date.now() / 1000)
  context.request.setHeader("X-Ovh-Timestamp", timestamp);
  const signature = signOvhRequest(as, ck, httpMethod, requestUrl, requestBody, timestamp)
  context.request.setHeader("X-Ovh-Signature", signature);
}]

