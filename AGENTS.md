## Coding Conventions
  - **Hungarian Notation**: Use Hungarian Notation for variable naming
  - **camelCase**: Use camelCase when naming all variables
  - **No Build Tools**: Avoid build tools such as Babel, Webpack, or Vite unless it is explicitly required. Code must run either directly in the browser or via nodeJS
  - **Dependencies**: Do not add external libraries such as jQuery without approval. Prefer native Web APIs
  - **ECMAScript Version**: Target ES6+ features including arrow functions and template literals as well as promises
  - **External Libraries Local**: All external libraries that are included must not use a CDN but rather be included in project source files
  - **Booststrap Utility Classes**: Use only standard Bootstrap 5+ utility classes for layout, spacing, and colors. Avoid creating custom CSS classes or inline styles unless the design cannot be achieved without them.
  - **Comments**: Provide verbose comments to explain the flow of the code and anything that would be difficult for a beginner developer to understand.

## Accessibility
  - **Standards**: All user interfaces must meet WCAG 2.1+ accessibility standards
  - **Alt Tags**: All images must also have an alt tag attribute that describes the image
  - **Priority**: Prioritize accessibility over design
  - **ARIA Labels**: Include aria labels on all html form controls

## Project Structure
  - **Entry Point**: All nodeJS applications must use server.js for entry point
  - **API Routes**: All API routes must be included in the /api/ routing

## API Requirements
  - **RESTful**: All API routes should be RESTful in design
  - **UPDATE**: All UPDATE routes should use PUT rather than PATCH
  - **DELETE**: DELETE routes should use URL parameters for primary key indicators
  - **SELECT**: All user inputs for SELECT should be passed via URL query strings
  - **CREATE**: All user inputs for CREATES should be passed as JSON body data
  - **Input Validation**: All user passed inputs should be validated
  - **Status Codes**: Every route should return appropriate HTTP status codes for both success and error

## DO NOT
  - Do not hardcode credentials
  - Do not intermix user inputs in queries, require prepared statements
  - Do no skip input validation

## Decision Guidelines
  - Prefer simplier, less complex and maintainable code
  - Ask for clarification if uncertain

## Testing
  - Handle any missing input data with proper error messaging
  - POST and PUT routes should validate all required fields

## Canonical Code Examples (Follow These Patterns Exactly)
  ## All generated code MUST closely match the structure, naming conventions, and patterns shown in the examples below. Prefer copying these patterns over inventing new ones.
  ## These examples are generic, but the project will follow similar patterns for managing resume data such as users, education, and work experience.
  ### Example: Frontend Layout (Bootstrap 5, No Custom CSS)
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black">

        <link rel="icon" type="image/x-icon" href="/images/WeatherReportIcon.ico">

        <link rel="apple-touch-icon" sizes="60x60" href="images/WeatherReportIcon60.png">
        <link rel="apple-touch-icon" sizes="76x76" href="images/WeatherReportIcon76.png">
        <link rel="apple-touch-icon" sizes="120x120" href="images/WeatherReportIcon120.png">
        <link rel="apple-touch-icon" sizes="152x152" href="images/WeatherReportIcon152.png">

        <title>Application</title>



        <!-- Bootstrap loaded locally -->
        <link rel="stylesheet" href="/css/bootstrap.min.css">
        <script src="/js/bootstrap.bundle.min.js"></script>
    </head>
    <body class="bg-dark bg-gradient d-flex flex-column min-vh-100">
        <div class="col12 d-flex justify-content-center align-items-center flex-grow-1">
            <div class="card col-12 col-md-11 col-lg-10">
                <div class="card-body">
                    <div class="col-12 text-center" id="divContainer">
                        <h1>Current Weather Report</h1>
                    </div>
                    <hr>
                    <div class="d-flex justify-content-evenly align-items-center">
                        <div class="card col-4 text-center">
                            <div class="card-body">
                                <div class="d-flex justify-content-center align-items-center"  id="divCurrentTemp">
                                    <i class='bi bi-thermometer-half display-4 me-3' style='color:fireBrick' aria-hidden='true'></i>
                                </div>
                            </div>
                        </div>
                        <div class="card col-4 text-center">
                            <div class="card-body">
                                <div class="d-flex justify-content-center align-items-center"  id="divCurrentWind">
                                    <i class="bi bi-wind display-4 me-3" style="color:#595959" alt="Wind Speed"></i>
                                </div>
                            </div>
                        </div>
                        <div class="card col-4 text-center">
                            <div class="card-body">
                                <div class="d-flex justify-content-center align-items-center"  id="divCurrentHumidity">
                                    <i class="bi bi-droplet-fill display-4 me-3" style="color:blue" alt="Humidity"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <footer class="card rounded-0 col-12">
            <div class="card-body text-center">
                <h6>Weather data provided by <a href="https://open-meteo.com/">open-meteo</a></h6>
            </div>
        </footer>
        <script src="/js/sweetalert2.min.js"></script>
        <script>
        async function loadDataAsync() {
            try {
                const objResponse = await fetch('/api/items');

                if (!objResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                const arrItems = await objResponse.json();

                const elContainer = document.getElementById('divContainer');
                elContainer.innerHTML = '';

                arrItems.forEach(objItem => {
                    const elItem = document.createElement('div');
                    elItem.textContent = objItem.name;
                    elContainer.appendChild(elItem);
                });

            } catch (error) {
                console.error('Error loading data:', error);
            }
        }

        loadDataAsync();
    </script>
    </body>
    </html>
  ### Example: GET Route (SELECT with query params)
    app.get('/tree', (req,res) => {
        const strQuery = "SELECT * from tblTrees"
        dbTrees.all(strQuery, [], function(err, rows) {
            if(err){
                res.status(500).json({outcome:"error",message:err.message})
            } else {
                res.status(200).json({outcome:"success", message:rows})
            }
        })
    })

  ### Example: POST Route (CREATE with JSON body)
    app.post("/tree", (req,res) => {
        let strTreeID = uuidv4()
        let strTreeName = req.body.name.trim()
        let strType = req.body.type.trim()
        let strWoodType = req.body.woodtype.trim()

        if(!strTreeID || !strTreeName || !strType || !strWoodType){
            return res.status(400).json({message:"All items must be provided"})
        }

        const strQuery = "INSERT INTO tblTrees VALUES (?,?,?,?)"
        dbTrees.run(strQuery, [strTreeID, strTreeName, strType, strWoodType],function(err){
            if(err){
                res.status(500).json({outcome:"error",message:err.message})
            } else {
                res.status(201).json({outcome:"success", message:`Inserted tree with id ${strTreeID}`})
            }
        })
    })
  
  ### Example: PUT Route (UPDATE)
    app.put("/tree", (req,res) => {
        let strTreeID = req.body.treeid.trim()
        let strTreeName = req.body.name.trim()
        let strType = req.body.type.trim()
        let strWoodType = req.body.woodtype.trim()

        if(!strTreeID || !strTreeName || !strType || !strWoodType){
            return res.status(400).json({message:"All items must be provided"})
        }

        const strQuery = "UPDATE tblTrees SET Name=?, Type=?, WoodType=? WHERE TreeID = ?"
        dbTrees.run(strQuery, [strTreeName, strType, strWoodType, strTreeID], function(err){
            if(err){
                res.status(500).json({outcome:"error",message:err.message})
            } else {
                res.status(200).json({outcome:"success", message:`Inserted tree with id ${strTreeID}`})
            }
        })
    })

  ### Example: DELETE Route (URL param)
    app.delete('/tree/:treeid', (req,res) => {
        let strTreeID = req.params.treeid

        if(!strTreeID){
            return res.status(400).json({message:"TreeID must be provided"})
        }

        const strQuery = "DELETE FROM tblTrees WHERE TreeID = ?"
        dbTrees.run(strQuery, [strTreeID],function(err){
            if(err){
                res.status(500).json({outcome:"error",message:err.message})
            } else {
                res.status(200).json({outcome:"success", message:`Deleted tree with id ${strTreeID}`})
            }
        })
    })
  ### GOLDEN PATTERN: Standard API Route Structure

    app.post('/api/resource', async (req, res) => {
        try {
            const { strField } = req.body;

            // Validate required input parameters
            if (!strField) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            const strQuery = "INSERT INTO table (field) VALUES (?)";

            await db.query(strQuery, [strField]);

            return res.status(201).json([{ message: "Resource created successfully" }]);

        } catch (error) {
            console.error('POST /api/resource error:', error);
            return res.status(500).json({ error: "Internal server error" });
        }
    });