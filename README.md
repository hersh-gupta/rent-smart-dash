# RentSmart Boston Dashboard

The RentSmart Boston Dashboard is a housing violations search tool to help prospective tenants in Boston. 

The City of Boston provides compiled data on housing violations, building violations, enforcement violations, housing complaints, sanitation requests, and/or civic maintenance requests. The City releases this data through [Analyze Boston](https://data.boston.gov/) and they provide a [Tableau dashboard](https://www.boston.gov/departments/analytics-team/rentsmart-boston) to allow users to search the data.

This dashboard is an **entirely independent effort** to make the RentSmart Boston data more useable via a web-first approach. The advantages of this include:
- **Accessibility and responsiveness:** Frameworks like Vue make it easier to create accessible and mobile-friendly dashboards that work well on all devices. Tableau's web interface can be more limited in responsiveness.
- **More flexibility and control over the frontend:** With web frameworks, developers have full control over the JavaScript framework powering the frontend. This allows for more customization and interactivity compared to Tableau's more rigid web interface.
- **Lower cost:** Most web frameworks are free, while Tableau requires expensive licensing, especially when government organization answer to taxpayers. 
- **Civic Open Source:** By releasing projects that use open source software, governments can help drive innovation. Open collaboration leads to better software that benefits all parties.


## Credits
- [vuejs/core](https://github.com/vuejs/core)
- [vitejs/vite](https://github.com/vitejs/vite)
- [vuejs/router](https://github.com/vuejs/router)
- [mapbox/mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js)
- [vuejs/pinia](https://github.com/vuejs/pinia)
- [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss)
- [postcss/postcss](https://github.com/postcss/postcss)
- [postcss/autoprefixer](https://github.com/postcss/autoprefixer)

## Contributing
Contributions are welcome. This project uses yarn.

Install all dependencies: 
`$ yarn install`

Run the development server: 
`$ yarn dev`

Build all packages: 
`$ yarn build`

## License
The source code in this repository is licensed under GNU GPL.