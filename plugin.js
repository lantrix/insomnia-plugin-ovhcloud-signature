const crypto = require('crypto')

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
  console.log("requestBody " + requestBody);
  const httpMethod = context.request.getMethod().toUpperCase();
  const body = context.request.getBody()
  let requestBody = '';
  if (typeof(body) === 'object' && Object.keys(body).length > 0) {
    if (httpMethod === 'PUT' || httpMethod === 'POST') {
      // Escape unicode
      requestBody = JSON.parse(body.text);
    }
  }
  const timestamp = Math.round(Date.now() / 1000)
  context.request.setHeader("X-Ovh-Timestamp", timestamp);
  const signature = signOvhRequest(as, ck, httpMethod, requestUrl, requestBody, timestamp)
  context.request.setHeader("X-Ovh-Signature", signature);
}]
