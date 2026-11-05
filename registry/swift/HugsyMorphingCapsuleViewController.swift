#if canImport(UIKit)
  import Observation
  import SwiftUI
  import UIKit

  @MainActor @Observable final class HugsyMorphingCapsuleModel {
    var phase: HugsyCapsulePhase

    init(phase: HugsyCapsulePhase) {
      self.phase = phase
    }
  }

  private struct HugsyMorphingCapsuleHost: View {
    let model: HugsyMorphingCapsuleModel
    let content: (HugsyCapsulePhase) -> UIView
    let onChange: (HugsyCapsulePhase) -> Void

    var body: some View {
      HugsyMorphingCapsule(
        phase: Binding(
          get: { model.phase },
          set: { value in
            model.phase = value
            onChange(value)
          })
      ) { phase in
        HugsyUIViewBox(content(phase))
      }
    }
  }

  public final class HugsyMorphingCapsuleViewController: UIViewController {
    public var didChangePhase: ((HugsyCapsulePhase) -> Void)?
    public var phase: HugsyCapsulePhase {
      get { model.phase }
      set { model.phase = newValue }
    }
    private let model: HugsyMorphingCapsuleModel
    private let contentView: (HugsyCapsulePhase) -> UIView
    private let cache = HugsyUIViewCache()

    public init(
      phase: HugsyCapsulePhase = .compact,
      contentView: @escaping (HugsyCapsulePhase) -> UIView
    ) {
      self.model = HugsyMorphingCapsuleModel(phase: phase)
      self.contentView = contentView
      super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { nil }

    public override func viewDidLoad() {
      super.viewDidLoad()
      view.backgroundColor = .clear
      hugsyEmbed(
        HugsyMorphingCapsuleHost(
          model: model,
          content: { [unowned self] phase in
            cache.view(for: AnyHashable(phase)) { contentView(phase) }
          },
          onChange: { [unowned self] value in didChangePhase?(value) }))
    }
  }
#endif
