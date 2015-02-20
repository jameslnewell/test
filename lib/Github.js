var Client          = require('go-fetch');
var prefix          = require('go-fetch-prefix-url');
var useragent       = require('go-fetch-useragent');
var auth            = require('go-fetch-auth');
var contentType     = require('go-fetch-content-type');
var followRedirects = require('go-fetch-follow-redirects');
var parseBody       = require('go-fetch-parse-body');
var decompress      = require('go-fetch-decompress');
var zlib            = require('zlib');
var semver          = require('semver');
var debug           = require('debug')('PackageRegistry:Github');

/**
 * Split the package name into a user and repo name
 * @param   {string} name
 * @returns {{user: string, repo: string}}
 */
function split_name(name) {
  var parts = name.split('/');
  return {
    user: parts[0],
    repo: parts[1]
  };
}

/**
 * Github registry
 * @constructor
 */
function Github(username, password) {
  this._client = new Client();
  this._client
    .use(prefix('https://api.github.com/'))
    .use(useragent('go-fetch'))
    .use(followRedirects())
    .use(contentType)
    .use(decompress())
    .use(parseBody.json())
  ;

  if (username && password) {
    this._client.use(auth(username, password));
  }

}

/**
 * Check whether a package is supported by this registry
 * @param   {Package}                     package
 * @param   {function(Error, bool)}       callback
 * @returns {Github}
 */
Github.prototype.supports = function(package, callback) {
  callback(null, true);
  return this;
};

/**
 * Resolve a package reference to an exact version
 * @param   {Package}                     package
 * @param   {function(Error, Package)}    callback
 * @returns {Github}
 */
Github.prototype.resolve = function(package, callback) {
  debug('.resolve() '+package);
//todo: should return a new package object
  if (semver.validRange(package.version)) {

    var
      name  = split_name(package.name),
      url   = '/repos/'+name.user+'/'+name.repo+'/git/refs/tags'
    ;

    this._client.get(url, function(error, response) {
      if (error) return callback(error);

      //check the content type
      if (response.getContentType() !== 'application/json') {
        return callback(new Error('Invalid API response with content type'));
      }

      //get the parsed JSON
      var body = response.getBody();

      //check for an error
      if (response.getStatus() !== 200) {
        return callback(new Error(body.message));
      }

      var tags = body.map(function(ref) {
        return ref.ref.split('/').pop();
      });

      //update the package version to the highest satisfying
      package.version = semver.maxSatisfying(tags, package.version);

      callback(error, package);
    });

  } else {
    return callback(undefined, package); //allow branches etc
  }

  return this;
};

/**
 * Get the manifest for the registry
 * @param   {Package}                     package
 * @param   {function(Error, Object)}     callback
 * @returns {Github}
 */
Github.prototype.manifest = function(package, callback) {
  debug('.manifest() '+package);

  //extract user and repo name from package name
  var
    name  = split_name(package.name),
    url   = '/repos/'+name.user+'/'+name.repo+'/contents/component.json?ref='+package.version
  ;

  //fetch the manifest content from github
  this._client.get(url, function(error, response) {
    if (error) return callback(error);

    //check the content type
    if (response.getContentType() !== 'application/json') {
      return callback(new Error('Invalid API response with content type'));
    }

    //get the parsed JSON
    var body = response.getBody();

    //check for an error
    if (response.getStatus() !== 200) {
      return callback(new Error(body.message));
    }

    //extract the encoded content (base64)
    var content = JSON.parse((new Buffer(body.content, body.encoding)).toString());

    callback(error, content);
  });

  return this;
};

/**
 * Download a package from the registry and return a *.tar stream
 * @param   {Package}                     package
 * @param   {function(Error, Stream)}     callback
 * @returns {Github}
 */
Github.prototype.download = function(package, callback) {
  debug('.download() '+package);

  //extract user and repo name from package name
  var
    name  = split_name(package.name),
    url   = '/repos/'+name.user+'/'+name.repo+'/tarball/'+package.version
  ;

  //get the release tarball
  this._client.get(url, function(error, response) {
    if (error) return callback(error);

    //check the response
    if (response.getContentType() !== 'application/x-gzip') {
      callback(new Error('Invalid API response with content type '+response.getContentType()));
    }

    //create and decompress the stream
    var stream = zlib.createGunzip();
    response.getBody().pipe(stream);

    callback(error, stream);
  });

  return this;
};

module.exports = Github;