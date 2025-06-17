// Test script to verify ETag-based SDE version checking
const https = require('https');

async function testETagCheck() {
  console.log('🧪 Testing ETag-based SDE version checking...');
  
  const SDE_URL = 'https://eve-static-data-export.s3-eu-west-1.amazonaws.com/tranquility/sde.zip';
  
  try {
    // Simulate our HEAD request
    const response = await new Promise((resolve, reject) => {
      const options = new URL(SDE_URL);
      options.method = 'HEAD';
      
      const req = https.request(options, (res) => {
        resolve({
          status: res.statusCode,
          headers: res.headers
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
    
    console.log('✅ Response status:', response.status);
    console.log('✅ ETag:', response.headers.etag);
    console.log('✅ Last-Modified:', response.headers['last-modified']);
    console.log('✅ Content-Length:', response.headers['content-length']);
    
    if (response.headers.etag) {
      const cleanETag = response.headers.etag.replace(/"/g, '');
      const shortETag = cleanETag.substring(0, 8);
      const date = new Date(response.headers['last-modified']).toISOString().split('T')[0];
      const version = `${date}-${shortETag}`;
      
      console.log('✅ Generated version:', version);
      console.log('✅ File size:', `${(parseInt(response.headers['content-length']) / 1024 / 1024).toFixed(1)}MB`);
    }
    
    console.log('🎉 ETag test completed successfully!');
    
  } catch (error) {
    console.error('❌ ETag test failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  testETagCheck();
}

module.exports = { testETagCheck };