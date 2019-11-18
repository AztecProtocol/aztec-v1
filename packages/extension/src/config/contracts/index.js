import productionConfig from './production';
import developmentConfig from './development';

export default (process.env.NODE_ENV === 'production')
    ? productionConfig
    : developmentConfig;
