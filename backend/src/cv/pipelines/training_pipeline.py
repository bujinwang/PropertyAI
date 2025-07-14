import os
import luigi
from luigi.util import inherits
from .data_ingestion import IngestData
from .data_preprocessing import PreprocessData
from .model_training import TrainModel
from .model_evaluation import EvaluateModel

class TrainingPipeline(luigi.Task):
    data_path = luigi.Parameter(default='data/raw')
    model_path = luigi.Parameter(default='models')
    
    def requires(self):
        return EvaluateModel(data_path=self.data_path, model_path=self.model_path)
        
    def run(self):
        with self.output().open('w') as f:
            f.write('Training pipeline complete')
            
    def output(self):
        return luigi.LocalTarget(os.path.join(self.model_path, 'training_pipeline.txt'))

if __name__ == '__main__':
    luigi.run(['TrainingPipeline', '--local-scheduler'])
