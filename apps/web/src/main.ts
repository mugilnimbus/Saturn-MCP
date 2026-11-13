import { mount } from 'svelte';
import App from './App.svelte';
import { config } from './config';
import './lib/styles/tokens.css';
import './lib/styles/components.css';
import './lib/styles/app.css';
import { app } from './lib/state/app.svelte';

document.title = config.appName;
app.start();
mount(App, { target: document.getElementById('app')! });
