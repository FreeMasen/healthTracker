(function() {
    if (localStorage.getItem('seeded')) {
        return; 
    }
    await this.seedTable(this.foods, 'assets/food_desc.json');
    await this.seedTable(this.foodGroups, 'assets/food_groups.json');    
    await this.seedTable(this.nutrition, 'assets/nut_data.json');
    await this.seedTable(this.nutritionDefs, 'assets/nutr_def.json');
    await this.seedTable(this.weights, 'assets/weight.json');
}

async function seedTable(table, route: string): Promise<void> {
    let seedData;
    let start = new Date();
    this.report(table.name);
    try {
        seedData = await fetch(route).then(res => res.json()); 
    } catch (e) {
        console.error('Failed to get seed data for', table.name, 'at route', route, e);
        throw e;
    }
    try {
        await table.clear();
    } catch (e) {
        console.error('Failed to clear ', table.name, e);
        throw e;
    }
    try {
        await table.bulkAdd(seedData)
    } catch (e) {
        console.error('failed to add data to ', table.name, seedData);
    }
    if (this.tm) {
        clearTimeout(this.tm);
    }
    self.postMessage('finished');
})