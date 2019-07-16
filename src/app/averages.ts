import { Component, OnInit, EventEmitter } from '@angular/core';
import { Data } from './services/data';
import { MetabolismCalculator } from './services/metabolism';
import { IUser } from './services/database';

export class AveragesComponent {
    constructor(
        private data: Data,
    ) {}
}