const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  const reqQuery = { ...req.query };                                           // Copy req.query
  const removeFields = ['select', 'sort', 'page', 'limit'];                    // Fields to exclude
  removeFields.forEach(param => delete reqQuery[param]);                 // Loop over removeFields and delete them from reqQuery
  let queryStr = JSON.stringify(reqQuery);                                     // Create query string
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);// Create operators ($gt, $gte, etc)
  query = model.find(JSON.parse(queryStr));                                    // Finding resource

  if (req.query.select) {const fields = req.query.select.split(',').join(' ');  query = query.select(fields);} // Select Fields
  if (req.query.sort)   {const sortBy = req.query.sort.split(',').join(' ');    query = query.sort(sortBy);  } 
                                                                          else {query = query.sort('-createdAt');}   // Sort
  //http://x ?house=true & select=name,description & sort=name & page=2 & limit=10
  const page       = parseInt(req.query.page, 10) || 1;                        // Pagination
  const limit      = parseInt(req.query.limit, 10) || 25;                      //parseint- converts to number, with base 10
  const startIndex = (page - 1) * limit; 
  const endIndex   = page * limit;
  const total      = await model.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);
  if (populate) { query = query.populate(populate) }
  const results = await query;                                                 // Executing query

  const pagination = {};                                                       // Pagination result
  if (endIndex < total) {pagination.next = { page: page + 1, limit } }
  if (startIndex > 0)   {pagination.prev = { page: page - 1, limit } }
  res.advancedResults = { success: true, count: results.length, pagination, data: results };
  next();
};

module.exports = advancedResults;
