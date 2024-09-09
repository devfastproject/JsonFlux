const jsonDbManager = (path = __dirname + "/DB.json", opts = {}) => {
    const fs = require("fs");
    this.path = path;
    this.data = { __UNIQUES__: {} };
    this.models = {};
    this.opts = opts;
    this.logs = opts.logs !== undefined ? opts.logs : true;

    try {
        if (!fs.existsSync(this.path)) {
            fs.writeFileSync(this.path, JSON.stringify(this.data), "utf-8");
        } else {
            this.data = JSON.parse(fs.readFileSync(this.path, "utf-8"));
        }
    } catch (err) {
        throw new Error("Error al inicializar la base de datos: " + err);
    }

    console.log("Conexión a la base de datos exitosa.");

    if (this.opts.autosave) {
        if (isNaN(this.opts.autosave)) throw new Error("El autoguardado debe ser un valor de tipo Int");
        setInterval(() => {
            this.save();
        }, this.opts.autosave);
    }

    this.save = () => {
        try {
            fs.writeFileSync(this.path, JSON.stringify(this.data), "utf-8");
        } catch (err) {
            this.log("Error al guardar datos: " + err);
        }
    };

    this.Types = {
        NUMBER: "Number",
        BOOLEAN: "Boolean",
        STRING: "String",
        OBJECT: "Object",
        ARRAY: "Array"
    };

    // Carga de modelos desde el archivo
    try {
        const fileContent = JSON.parse(fs.readFileSync(this.path, "utf-8"));
        this.data = fileContent;

        this.models = {};
        for (let key in this.data) {
            if (key !== "__UNIQUES__") {
                this.models[key] = {};
                const firstItem = this.data[key][Object.keys(this.data[key])[0]];
                if (firstItem) {
                    for (let field in firstItem) {
                        this.models[key][field] = {
                            type: firstItem[field] ? firstItem[field].constructor.name : 'String',
                            allowNull: false
                        };
                    }
                }
            }
        }
        console.log("Datos y modelos cargados exitosamente.");
    } catch (err) {
        console.log("Error al cargar los datos y modelos: " + err);
        this.data = { __UNIQUES__: {} };
        this.models = {};
    }

    this.addModel = (modelName, model) => {
        if (!this.data[modelName]) this.data[modelName] = {};
        this.models[modelName] = model;
        if (!this.data.__UNIQUES__[modelName]) this.data.__UNIQUES__[modelName] = {};
        for (let m in model) {
            if (model[m].unique && !this.data.__UNIQUES__[modelName][m]) this.data.__UNIQUES__[modelName][m] = [];
        }
    };

    this.find = (model, opts = {}) => {
        const time = new Date().getTime();
        let results = [];
        if (!this.models[model]) {
            this.log(`No se encontró el modelo ${model}`);
            return results;
        }

        const _limit_1 = opts.limit === 1;
        let limit = opts.limit || 10000;
        if (opts.where) {
            for (let d in this.data[model]) {
                if (opts.where(this.data[model][d]) === true) {
                    results.push(this.data[model][d]);
                    if (--limit <= 0) break;
                }
            }
        } else {
            results = Object.values(this.data[model]);
        }

        this.log(`Búsqueda de ${results.length} resultados en ${new Date().getTime() - time}ms`);
        return JSON.parse(JSON.stringify(_limit_1 && results.length > 0 ? results[0] : results));
    };

    this.create = (model, data) => {
        const time = new Date().getTime();
        if (!this.models[model]) {
            this.log(`El modelo ${model} no existe`);
            return null;
        }

        let modelData = {}, uniques = {};
        for (let d in this.models[model]) {
            if (this.models[model][d].allowNull === false && data[d] === undefined) {
                this.log(`El parámetro ${d} no puede ser nulo`);
                return null;
            }

            if (data[d] === undefined && this.models[model][d].default !== undefined) {
                data[d] = this.models[model][d].default;
            }

            if (data[d] && data[d].constructor.name !== this.models[model][d].type) {
                this.log(`Se requiere un parámetro de tipo ${this.models[model][d].type}, pero se obtuvo ${data[d].constructor.name}`);
                return null;
            }

            if (this.models[model][d].unique && this.data.__UNIQUES__[model][d].includes(data[d])) {
                this.log(`El campo ${d} se encontró duplicado con el valor ${data[d]}`);
                return null;
            }

            if (this.models[model][d].unique) uniques[d] = data[d];
            modelData[d] = data[d];
        }

        Object.keys(uniques).forEach(u => this.data.__UNIQUES__[model][u].push(uniques[u]));

        const nextIndex = String(Object.keys(this.data[model]).length + 1);
        modelData.index = nextIndex;
        modelData.createdAt = new Date().getTime();
        this.data[model][nextIndex] = modelData;

        this.log(`Modelo creado en ${new Date().getTime() - time}ms`);
        return JSON.parse(JSON.stringify(modelData));
    };

    this.update = (model, modelToUpdate, data) => {
        const time = new Date().getTime();
        if (!this.data[model] || !this.data[model][modelToUpdate.index]) {
            this.log(`El modelo o índice no existen`);
            return null;
        }

        let existingData = JSON.parse(JSON.stringify(this.data[model][modelToUpdate.index]));

        for (let d in data) {
            if (!this.models[model][d]) {
                this.log(`El parámetro ${d} no pertenece al modelo ${model}`);
                return null;
            }

            if (data[d] && data[d].constructor.name !== this.models[model][d].type) {
                this.log(`Se requiere un parámetro de tipo ${this.models[model][d].type}, pero se obtuvo ${data[d].constructor.name}`);
                return null;
            }

            if (this.models[model][d].unique) {
                const uniqueIndex = this.data.__UNIQUES__[model][d].indexOf(existingData[d]);
                if (uniqueIndex !== -1) this.data.__UNIQUES__[model][d].splice(uniqueIndex, 1);

                if (this.data.__UNIQUES__[model][d].includes(data[d])) {
                    this.log(`El campo ${d} se encontró duplicado con el valor ${data[d]}`);
                    return null;
                }
                this.data.__UNIQUES__[model][d].push(data[d]);
            }

            existingData[d] = data[d];
        }

        existingData.updatedAt = new Date().getTime();
        this.data[model][modelToUpdate.index] = existingData;
        this.log(`Modelo actualizado en ${new Date().getTime() - time}ms`);
        return JSON.parse(JSON.stringify(existingData));
    };

    this.drop = (model) => {
        const time = new Date().getTime();
        if (this.data[model]) {
            this.data[model] = {};
            this.data.__UNIQUES__[model] = {};
            this.log(`Modelo ${model} eliminado en ${new Date().getTime() - time}ms`);
        } else {
            this.log(`No se encontró el modelo ${model}`);
        }
    };

    this.destroy = (model, modelData) => {
        const time = new Date().getTime();
        if (this.data[model] && modelData.index && this.data[model][modelData.index]) {
            Object.keys(this.data.__UNIQUES__[model]).forEach(un => {
                const uniqueIndex = this.data.__UNIQUES__[model][un].indexOf(this.data[model][modelData.index][un]);
                if (uniqueIndex !== -1) this.data.__UNIQUES__[model][un].splice(uniqueIndex, 1);
            });
            delete this.data[model][modelData.index];
            this.log(`Índice ${modelData.index} del modelo ${model} eliminado en ${new Date().getTime() - time}ms`);
        } else {
            this.log(`El modelo o índice no existen`);
        }
    };

    this.log = (message) => this.logs && console.log("[jsonDbManager] " + message);
    return this;
};

module.exports = jsonDbManager;
