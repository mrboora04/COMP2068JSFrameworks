try {
    // Attempt to load the module
    const indexRouter = require('./routes/index');
    console.log('Index Router Loaded:', indexRouter);
  } catch (err) {
    console.error('Error loading index router:', err.message);
    console.error('Stack trace:', err.stack);
    // Check if the file exists and is readable
    const fs = require('fs');
    fs.access('./routes/index.js', fs.constants.F_OK, (err) => {
      if (err) console.error('File access error:', err.message);
      else console.log('File exists and is accessible');
    });
  }