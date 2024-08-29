/*******************
 * JSON DB Manager *
 *******************
 * @param String{path}
 * @param Object{opts}
 * @Return {self}
 **********/
 
const jsonDbManager = (path = __dirname + "/DB.json", opts = {}) => {
    this.path = path;
    this.data = { __UNIQUES__: {} };
    this.models = {};
    this.opts = opts;
    this.logs = (opts.logs != undefined ? opts.logs : true);
    
    const fs = require("fs");
    try {
        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, JSON.stringify(this.data), "utf-8");
        } else {
            this.data = JSON.parse(fs.readFileSync(path, "utf-8"));
        }
    } catch (err) {
        throw new Error("" + err);
    }

    console.log("Conexión a la base de datos exitosa.");

    if (this.opts.autosave) {
        if(isNaN(this.opts.autosave)) throw new Error("El autoguardado debe ser un valor de tipo Int");
        setInterval(() => {
            this.save();
        }, this.opts.autosave);
    } 

    this.save = () => {
        fs.writeFileSync(path, JSON.stringify(this.data), "utf-8");
    };

    this.Types = {
        NUMBER: "Number",
        BOOLEAN: "Boolean",
        STRING: "String",
        OBJECT: "Object",
        ARRAY: "Array"
    };

    this.addModel = (modelName, model) => {
        if (!this.data[modelName]) this.data[modelName] = {};
        this.models[modelName] = model;
        if (!this.data["__UNIQUES__"][modelName]) this.data["__UNIQUES__"][modelName] = {};
        for (let m in model) {
            if (model[m].unique === true && !this.data["__UNIQUES__"][modelName][m]) this.data["__UNIQUES__"][modelName][m] = [];
        }

    }

    this.find = (model, opts) => {
        let time = new Date().getTime();
        let results = [];
        if (!this.models[model]) {
            this.log("No se encontro el modelo " + model);
            return results;
        }
        const _limit_1 = (opts && opts.limit && opts.limit == 1 ? true : false);
        let limit = (opts && opts.limit ? opts.limit : 10000);
        if (opts && opts.where) {
            for (let d in this.data[model]) {
                if (opts.where(this.data[model][d]) == true) {
                    results.push(this.data[model][d]);
                    limit--;
                }
                if (limit <= 0) {
                    this.log("Se realizo una busqueda de " + results.length + " resultados en " + (new Date().getTime() - time) + "ms");
                    return (JSON.parse(JSON.stringify(_limit_1 && results.length > 0 ? results[0] : results)));
                }
            }
        } else {
            results = Array.from(Object.keys(this.data[model]), k => this.data[model][k]);
            this.log("Se realizo una busqueda de " + results.length + " resultados en " + (new Date().getTime() - time) + "ms");
            return JSON.parse(JSON.stringify(results));
        }
        this.log("Se realizo una busqueda de " + results.length + " resultados en " + (new Date().getTime() - time) + "ms");
        return JSON.parse(JSON.stringify(results.length > 0 ? results : null));
    }

    this.create = (model, data) => {
        const time = new Date().getTime();
        let modelData = {} , uniques = {};
        for (let d in this.models[model]) {
            if (this.models[model][d].allowNull === false && data[d] == undefined) {
                this.log("El parametro " + d + " no se puede encontrar nulo");
                return null;
            }


            if (!data[d] && this.models[model][d].default != undefined) {
                data[d] = this.models[model][d].default;
            }
            if (data[d])
                if (data[d].constructor.name != this.models[model][d].type) {
                    this.log("Se requeria un parametro de tipo " + this.models[model][d].type + " en cambio se obtuvo " + (data[d]).constructor.name);
                    return null;
                }

            if (this.models[model][d].unique === true) {
                if (this.data["__UNIQUES__"][model][d].includes(data[d])) {
                    let duplo = "El campo " + d + " se encontro duplicado con el valor " + data[d];
                    this.log("El campo " + d + " se encontro duplicado con el valor " + data[d]);
                    return duplo;
                }
                uniques[d] = data[d];
            }
            modelData[d] = data[d];
        }
        
        for(let u in uniques){
            this.data["__UNIQUES__"][model][u].push(uniques[u]);
        }
        if(!this.data[model]) this.data[model] = {};
        const ok = Object.keys(this.data[model]);
        modelData.index = String(parseInt(ok[ok.length - 1] ? ok[ok.length - 1] : 0) + 1);
        modelData.createdAt = new Date().getTime();
        this.data[model][modelData.index] = modelData;
        this.log("Se creo un modelo en " + (new Date().getTime() - time) + "ms");
        return JSON.parse(JSON.stringify(modelData));
    }

    this.update = (model, modelToUpdate, data) => {
        const time = new Date().getTime();
        if(!this.data[model] || !this.data[model][modelToUpdate.index]) return null;
        
        modelToUpdate = JSON.parse(JSON.stringify(this.data[model][modelToUpdate.index]));
        
        for (let d in data) {
            if (!this.models[model] || !this.models[model][d]) {
                this.log("El parametro " + d + " no pertenece a el modelo " + model);
                return null;
            }
            if (this.models[model][d] && data[d].constructor.name != this.models[model][d].type) {
                this.log("Se requeria un parametro de tipo " + this.models[model][d].type + " en cambio se obtuvo " + (data[d]).constructor.name);
                return null;
            }

            if (this.models[model][d].unique === true) {
                this.data.__UNIQUES__[model][d].splice(this.data.__UNIQUES__[model][d].indexOf(modelToUpdate[d]) , 1);
                if (this.data["__UNIQUES__"][model][d].includes(data[d])) {
                    this.log("El campo " + d + " se encontro duplicado con el valor " + data[d]);
                    return null;
                }
                this.data["__UNIQUES__"][model][d].push(data[d]);
            }

            modelToUpdate[d] = data[d];
        }

        modelToUpdate.updatedAt = new Date().getTime();
        this.data[model][modelToUpdate.index] = modelToUpdate;
        this.log("Se actualizo un modelo en " + (new Date().getTime() - time) + "ms");
        return JSON.parse(JSON.stringify(modelToUpdate));
    }

    this.count = (model) => {
        return (this.data[model] ? Object.keys(this.data[model]).length : 0);
    }

    this.drop = (model) => {
        const time = new Date().getTime();
        if (this.data[model]) {
            this.data[model] = {};
            this.data["__UNIQUES__"][model] = {};
            this.log("Se elimino el modelo " + model + " en " + (new Date().getTime() - time) + "ms");
        } else this.log("No se encontro el modelo " + model);
    };

    this.destroy = (model, modelData) => {
        const time = new Date().getTime();
        if (this.data[model] && modelData.index && this.data[model][modelData.index]) {
            for(let un in this.data.__UNIQUES__[model]){
                this.data.__UNIQUES__[model][un].splice(this.data.__UNIQUES__[model][un].indexOf(this.data[model][modelData.index][un]) , 1);
            }
            delete this.data[model][modelData.index];
            this.log("Se elimino el indice " + modelData.index + " de el modelo " + model + " en " + (new Date().getTime() - time) + "ms");
            return true;
        } else {
            this.log("No se encontro el indice " + modelData.index + " de el modelo " + model);
            return false;
        }
    }
    
    this.addRows = (model , rows) => {
        const time = new Date().getTime();
        if(!rows) return null;
        if(!this.data[model]) return null;

        for(let m in this.data[model]){
            for(let r in rows){
                this.data[model][m][r] = (rows[r].default ? rows[r].default : null);
                if(rows[r].unique){
                    if(!this.data.__UNIQUES__[model][r]) this.data.__UNIQUES__[model][r] = [];
                }
                if(rows[r].allowNull == false){
                    if(!this.data[model][m][r]) {
                        this.log("Se esperaba un valor pero se obtuvo nulo");
                        return null;
                    }
                }
            }
        }
    }

    this.log = (text) => {
        if (this.logs) console.log(text);
    }



    return this;
};

module.exports = jsonDbManager;
